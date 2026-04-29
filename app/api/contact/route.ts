import { z } from 'zod';

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
      return Response.json(
        { ok: false, errors: result.error.issues },
        { status: 400 }
      );
    }

    const data = result.data;
    const prefix = data.type === 'partnership' ? '[PARTNERSHIP]' : '[CONTACT]';
    console.log(`${prefix}`, JSON.stringify(data, null, 2));

    // TODO: npm install resend — then add email sending here:
    // if (process.env.RESEND_API_KEY) {
    //   const { Resend } = await import('resend');
    //   const resend = new Resend(process.env.RESEND_API_KEY);
    //   await resend.emails.send({
    //     from: 'Good Kicks <noreply@goodkicks.co>',
    //     to: process.env.CONTACT_EMAIL,
    //     subject: data.type === 'partnership' ? `Partnership inquiry from ${data.name}` : `Message from ${data.name}`,
    //     text: JSON.stringify(data, null, 2),
    //   });
    // }

    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { ok: false, errors: [{ message: 'Server error. Please try again.' }] },
      { status: 500 }
    );
  }
}
