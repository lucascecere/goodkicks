import { z } from 'zod';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { upsertContact } from '@/lib/supabase/upsert-contact';
import { resend } from '@/lib/email/resend-client';

const generalSchema = z.object({
  type: z.literal('general'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const partnershipSchema = z.object({
  type: z.literal('partnership'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  groupName: z.string().min(1, 'School or group name is required'),
  igHandle: z.string().min(1, 'Instagram handle is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const contactSchema = z.discriminatedUnion('type', [generalSchema, partnershipSchema]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return Response.json({ ok: false, errors: result.error.issues }, { status: 400 });
    }

    const data = result.data;

    // Save to Supabase
    const supabase = createSupabaseServiceClient();
    const { error: dbError } = await supabase.from('contact_submissions').insert({
      type: data.type,
      name: data.name,
      email: data.email,
      message: data.message,
      group_name: data.type === 'partnership' ? data.groupName : null,
      ig_handle: data.type === 'partnership' ? data.igHandle : null,
    });
    if (dbError) console.error('[contact] DB insert error:', dbError.message);
    await upsertContact({ email: data.email, name: data.name, source: 'contact' });

    // Email notification
    if (process.env.RESEND_API_KEY) {
      try {
        const subject = data.type === 'partnership'
          ? `Partnership inquiry — ${data.name} (${(data as { groupName: string }).groupName})`
          : `Contact form — ${data.name}`;

        const text = data.type === 'partnership'
          ? `Name: ${data.name}\nEmail: ${data.email}\nGroup: ${(data as { groupName: string }).groupName}\nInstagram: ${(data as { igHandle: string }).igHandle}\n\n${data.message}`
          : `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`;

        await resend.emails.send({
          from: 'Good Kicks <info@goodkicks.co>',
          to: process.env.PARTNER_NOTIFICATION_EMAIL ?? 'info@goodkicks.co',
          replyTo: data.email,
          subject,
          text,
        });
      } catch (err) {
        console.error('[contact] Email error:', err);
      }
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, errors: [{ message: 'Server error. Please try again.' }] }, { status: 500 });
  }
}
