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

const wholesaleSchema = z.object({
  type: z.literal('wholesale'),
  brand,
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  company: z.string().min(1, 'Company / shop name is required'),
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

    const message =
      'message' in data && data.message
        ? data.message
        : data.type === 'town_request'
          ? `Town request: ${data.town}`
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
