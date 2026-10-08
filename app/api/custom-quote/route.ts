import { after } from 'next/server';
import { z } from 'zod';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { upsertContact } from '@/lib/supabase/upsert-contact';
import { sendEmail } from '@/lib/email/resend-client';
import { TOWNIES_FROM } from '@/lib/email/send-rep-welcome';
import { callerIp, rateLimit } from '@/lib/townies/spin-ratelimit';

/**
 * Custom hat quote requests from /custom-hats/build.
 *
 * The richer cousin of the wholesale form in app/api/contact: same recipient,
 * same sender, same contact_submissions row (type 'wholesale', so it lands in
 * the bulk pile in admin), but multipart, because it carries the rendered
 * mockup PNG and the customer's original logo as email attachments.
 *
 * Images are not stored anywhere but the email. The DB row keeps the text.
 */

const MB = 1024 * 1024;
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];

const str = (max: number) => z.string().trim().max(max).optional().default('');

const schema = z.object({
  name: z.string().trim().min(1, 'Your name is required').max(120),
  email: z.string().trim().email('A valid email is required').max(200),
  organisation: str(160),
  phone: str(40),
  town: str(80),
  quantity: z.enum(['25 to 49', '50 to 99', '100 to 199', '200+'], { message: 'Choose how many hats' }),
  neededBy: str(20),
  notes: str(2000),
  style: str(80),
  colours: str(120),
  frontLogo: str(300),
  sidePlacement: str(200),
  logoResized: str(5),
});

function text(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  return typeof v === 'string' ? v : undefined;
}

function file(fd: FormData, key: string): File | null {
  const v = fd.get(key);
  return v && typeof v !== 'string' && v.size > 0 ? v : null;
}

function safeName(name: string, fallback: string) {
  const clean = name.replace(/[^\w.\- ]+/g, '').trim().slice(0, 80);
  return clean || fallback;
}

function safeCustomerEmail(email: string) {
  // Same rule as lib/email/send-*.ts: real customers only from production.
  return process.env.NODE_ENV === 'production' ? email : 'delivered@resend.dev';
}

const bad = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

export async function POST(request: Request) {
  try {
    if (!rateLimit(`custom-quote:${callerIp(request.headers)}`, 5, 10 * 60 * 1000)) {
      return bad('Too many requests from here. Give it a few minutes.', 429);
    }

    let fd: FormData;
    try {
      fd = await request.formData();
    } catch {
      return bad('That upload did not come through. Try a smaller logo file.');
    }

    // Honeypot: a filled-in hidden field is a bot. Answer as if it worked.
    if (text(fd, 'company_website')) return Response.json({ ok: true });

    const parsed = schema.safeParse({
      name: text(fd, 'name'),
      email: text(fd, 'email'),
      organisation: text(fd, 'organisation'),
      phone: text(fd, 'phone'),
      town: text(fd, 'town'),
      quantity: text(fd, 'quantity'),
      neededBy: text(fd, 'neededBy'),
      notes: text(fd, 'notes'),
      style: text(fd, 'style'),
      colours: text(fd, 'colours'),
      frontLogo: text(fd, 'frontLogo'),
      sidePlacement: text(fd, 'sidePlacement'),
      logoResized: text(fd, 'logoResized'),
    });
    if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Check the form and try again.');
    const d = parsed.data;

    const mockup = file(fd, 'mockup');
    if (!mockup || mockup.type !== 'image/png' || mockup.size > 3 * MB) {
      return bad('The mockup image did not come through. Try again.');
    }
    const logo = file(fd, 'logo');
    if (logo && (!LOGO_TYPES.includes(logo.type) || logo.size > 5 * MB)) {
      return bad('The logo needs to be a PNG, JPG or SVG under 5MB.');
    }
    const sideLogo = file(fd, 'sideLogo');
    if (sideLogo && (!LOGO_TYPES.includes(sideLogo.type) || sideLogo.size > 5 * MB)) {
      return bad('The second logo needs to be a PNG, JPG or SVG under 5MB.');
    }

    const details = [
      `Organisation: ${d.organisation || '(not given)'}`,
      `Name: ${d.name}`,
      `Email: ${d.email}`,
      d.phone ? `Phone: ${d.phone}` : null,
      d.town ? `Town: ${d.town}` : null,
      `Quantity: ${d.quantity}`,
      d.neededBy ? `Needed by: ${d.neededBy}` : null,
      '',
      `Hat: ${d.style || '(not given)'}`,
      `Colours: ${d.colours || '(not given)'}`,
      `Front logo: ${d.frontLogo || 'No logo uploaded'}`,
      `Side panel: ${d.sidePlacement || 'None'}`,
      d.logoResized === 'yes' ? 'Note: the original logo was over 3MB, so the attached copy was resized in the browser. Ask for the original if you need it.' : null,
      '',
      d.notes ? `Notes:\n${d.notes}` : 'Notes: (none)',
    ].filter((l): l is string => l !== null);

    // Stored message mirrors the wholesale route: everything in one text field.
    const message = ['Custom hat mockup request (/custom-hats/build)', '', ...details].join('\n');

    const attachments = [
      { filename: 'mockup.png', content: Buffer.from(await mockup.arrayBuffer()) },
      ...(logo ? [{ filename: safeName(logo.name, 'logo'), content: Buffer.from(await logo.arrayBuffer()) }] : []),
      ...(sideLogo
        ? [{ filename: `side-${safeName(sideLogo.name, 'logo')}`, content: Buffer.from(await sideLogo.arrayBuffer()) }]
        : []),
    ];

    // Custom-hat quotes go to the Townies inbox (Lucas, 10-08).
    const inbox = process.env.TOWNIES_NOTIFICATION_EMAIL ?? 'info@townies.shop';
    const qualifier = [d.quantity, d.organisation || d.town].filter(Boolean).join(' · ');
    const subject = `[Townies] Custom hat quote: ${d.name}${qualifier ? ` (${qualifier})` : ''}`;
    const body = [...details, '', 'Mockup and logo attached. Reply to this email to reach the customer.'].join('\n');

    if (process.env.RESEND_API_KEY) {
      try {
        await sendEmail({ from: TOWNIES_FROM, to: inbox, replyTo: d.email, subject, text: body, attachments });
      } catch (err) {
        console.error('[custom-quote] Email error:', err);
      }
    } else {
      console.log('[custom-quote] (no RESEND_API_KEY) would send:', subject, '\n', body);
    }

    // Everything below is bookkeeping the customer does not need to wait for.
    after(async () => {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const supabase = createSupabaseServiceClient();
        const row = {
          type: 'wholesale',
          brand: 'townies',
          name: d.name,
          email: d.email,
          message,
          town: d.town || null,
          group_name: d.organisation || null,
          ig_handle: null,
        };
        const { error } = await supabase.from('contact_submissions').insert(row);
        if (error) {
          // Same fallback as app/api/contact: tolerate a missing `town` column.
          if (/town|column/i.test(error.message)) {
            const { town: _t, ...rest } = row;
            void _t;
            const retry = await supabase.from('contact_submissions').insert(rest);
            if (retry.error) console.error('[custom-quote] DB insert error:', retry.error.message);
          } else {
            console.error('[custom-quote] DB insert error:', error.message);
          }
        }
      }
      await upsertContact({ email: d.email, name: d.name, source: 'contact', brand: 'townies' });

      if (process.env.RESEND_API_KEY) {
        const first = d.name.split(/\s+/)[0];
        try {
          await sendEmail({
            from: TOWNIES_FROM,
            to: safeCustomerEmail(d.email),
            replyTo: inbox,
            subject: 'Got your custom hat request',
            text: [
              `Hi ${first},`,
              '',
              `Got your request for ${d.quantity} custom hats. Your mockup is attached so you have it too.`,
              '',
              "We'll reply with a price within two business days. If anything changes before then, reply to this email.",
              '',
              'Townies',
              'townies.shop',
            ].join('\n'),
            attachments: [attachments[0]],
          });
        } catch (err) {
          console.error('[custom-quote] Confirmation email error:', err);
        }
      }
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[custom-quote] Server error:', err);
    return bad('Server error. Please try again.', 500);
  }
}
