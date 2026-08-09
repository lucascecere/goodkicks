import { z } from 'zod';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { upsertContact } from '@/lib/supabase/upsert-contact';
import { sendEmail } from '@/lib/email/resend-client';

// brand-scopes every submission so Townies + Good Kicks data don't collide.
const brand = z.enum(['townies', 'goodkicks']).default('townies');

const generalSchema = z.object({
  type: z.literal('general'),
  brand,
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const partnershipSchema = z.object({
  type: z.literal('partnership'),
  brand,
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  groupName: z.string().min(1, 'School or group name is required'),
  igHandle: z.string().min(1, 'Instagram handle is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const townRequestSchema = z.object({
  type: z.literal('town_request'),
  brand,
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  town: z.string().min(1, 'Town is required'),
  message: z.string().optional(),
});

/**
 * Wholesale asks for a lot more than the other forms: a stockist enquiry that
 * arrives without location, volume or timeline needs a round-trip email before
 * it can even be qualified. Everything beyond the original four fields is
 * optional so a keen buyer is never blocked by a form.
 */
const wholesaleSchema = z.object({
  type: z.literal('wholesale'),
  brand,
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  company: z.string().min(1, 'Company / shop name is required'),
  phone: z.string().optional(),
  website: z.string().optional(),
  businessType: z.string().optional(),
  location: z.string().optional(),
  quantity: z.string().optional(),
  timeline: z.string().optional(),
  towns: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const contactSchema = z.discriminatedUnion('type', [
  generalSchema,
  partnershipSchema,
  townRequestSchema,
  wholesaleSchema,
]);

/**
 * Insert resilient to the shared Supabase not yet having the `brand` / `town`
 * columns: if the first insert fails on an unknown column, retry without those
 * fields so submissions are never silently dropped pre-cutover.
 */
async function insertSubmission(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  row: Record<string, unknown>,
) {
  const { error } = await supabase.from('contact_submissions').insert(row);
  if (!error) return;
  if (/brand|town|column/i.test(error.message)) {
    const { brand: _b, town: _t, ...rest } = row;
    void _b;
    void _t;
    const retry = await supabase.from('contact_submissions').insert(rest);
    if (retry.error) console.error('[contact] DB insert error:', retry.error.message);
    return;
  }
  console.error('[contact] DB insert error:', error.message);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return Response.json({ ok: false, errors: result.error.issues }, { status: 400 });
    }

    const data = result.data;

    // The longer wholesale fields have no columns of their own. Rather than
    // migrate contact_submissions for a low-volume form, the structured detail
    // is appended to the message so nothing a buyer typed is ever dropped.
    const wholesaleDetail =
      data.type === 'wholesale'
        ? [
            data.businessType && `Business type: ${data.businessType}`,
            data.location && `Location: ${data.location}`,
            data.website && `Website: ${data.website}`,
            data.phone && `Phone: ${data.phone}`,
            data.quantity && `Estimated first order: ${data.quantity}`,
            data.timeline && `Timeline: ${data.timeline}`,
            data.towns && `Towns of interest: ${data.towns}`,
          ].filter(Boolean)
        : [];

    const message =
      data.type === 'wholesale'
        ? [data.message, wholesaleDetail.length ? `\n— Details —` : '', ...wholesaleDetail]
            .filter(Boolean)
            .join('\n')
        : data.type === 'town_request'
          ? // ALWAYS lead with the town. contact_submissions has no `town`
            // column, so insertSubmission strips it on retry — and the old
            // fallback only embedded it when the message was empty, which
            // silently lost the town on any request that had a note attached.
            // The town is the entire point of this form.
            [`Town: ${data.town}`, data.message].filter(Boolean).join('\n\n')
          : 'message' in data && data.message
            ? data.message
            : '';
    const groupName =
      data.type === 'partnership' ? data.groupName : data.type === 'wholesale' ? data.company : null;
    const town = data.type === 'town_request' ? data.town : null;

    // Save to Supabase (brand-scoped, resilient to missing columns)
    const supabase = createSupabaseServiceClient();
    await insertSubmission(supabase, {
      type: data.type,
      brand: data.brand,
      name: data.name,
      email: data.email,
      message,
      town,
      group_name: groupName,
      ig_handle: data.type === 'partnership' ? data.igHandle : null,
    });
    await upsertContact({ email: data.email, name: data.name, source: 'contact' });

    // Email notification (no-op when RESEND_API_KEY is empty — logged instead)
    const fromName = data.brand === 'goodkicks' ? 'Good Kicks' : 'Townies';
    const subjectLabel: Record<typeof data.type, string> = {
      general: 'Contact form',
      partnership: 'Partnership inquiry',
      town_request: 'Town request',
      wholesale: 'Wholesale inquiry',
    };
    const subject = `[${fromName}] ${subjectLabel[data.type]} — ${data.name}${town ? ` (${town})` : groupName ? ` (${groupName})` : ''}`;
    const text = [
      `Brand: ${fromName}`,
      `Type: ${data.type}`,
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      town ? `Town: ${town}` : null,
      groupName ? `Company/Group: ${groupName}` : null,
      data.type === 'partnership' ? `Instagram: ${data.igHandle}` : null,
      '',
      message,
    ]
      .filter((l) => l !== null)
      .join('\n');

    if (process.env.RESEND_API_KEY) {
      try {
        await sendEmail({
          from: 'Townies <info@goodkicks.co>',
          to: process.env.PARTNER_NOTIFICATION_EMAIL ?? 'info@goodkicks.co',
          replyTo: data.email,
          subject,
          text,
        });
      } catch (err) {
        console.error('[contact] Email error:', err);
      }
    } else {
      console.log('[contact] (no RESEND_API_KEY) would send:', subject, '\n', text);
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, errors: [{ message: 'Server error. Please try again.' }] }, { status: 500 });
  }
}
