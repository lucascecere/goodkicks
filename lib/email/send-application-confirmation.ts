import { resend } from './resend-client';

const TEMPLATE = `hey {{first_name}},

we got your ambassador application. ✌️

we review every application personally and will get back to you within a few days. in the meantime, keep the circle going.

— The Good Kicks Team
goodkicks.co`;

function safeEmail(email: string) {
  return process.env.NODE_ENV === 'production' ? email : 'delivered@resend.dev';
}

export async function sendApplicationConfirmation({
  firstName,
  email,
}: {
  firstName: string;
  email: string;
}) {
  const text = TEMPLATE.replace(/\{\{first_name\}\}/g, firstName);

  await resend.emails.send({
    from: 'Good Kicks <info@goodkicks.co>',
    to: safeEmail(email),
    replyTo: 'info@goodkicks.co',
    subject: 'we got your application. ✌️',
    text,
  });
}
