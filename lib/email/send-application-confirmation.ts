import { resend } from './resend-client';
import { TOWNIES_FROM } from './send-rep-welcome';
import type { RealBrand } from '@/lib/admin/brand';

const GK_TEMPLATE = `hey {{first_name}},

we got your ambassador application. ✌️

we review every application personally and will get back to you within a few days. in the meantime, keep the circle going.

— The Good Kicks Team
goodkicks.co`;

const TOWNIES_TEMPLATE = `hey {{first_name}},

got your Town Rep application.

we read every one of these ourselves — no bots, no auto-filter. we're looking for people who actually rep where they're from, so give us a few days and we'll come back to you either way.

— Townies
townies.shop | @townies.shop`;

function safeEmail(email: string) {
  return process.env.NODE_ENV === 'production' ? email : 'delivered@resend.dev';
}

export async function sendApplicationConfirmation({
  firstName,
  email,
  brand = 'goodkicks',
}: {
  firstName: string;
  email: string;
  brand?: RealBrand;
}) {
  const isTownies = brand === 'townies';
  const text = (isTownies ? TOWNIES_TEMPLATE : GK_TEMPLATE).replace(
    /\{\{first_name\}\}/g,
    firstName,
  );

  await resend.emails.send({
    from: isTownies ? TOWNIES_FROM : 'Good Kicks <info@goodkicks.co>',
    to: safeEmail(email),
    replyTo: 'info@goodkicks.co',
    subject: isTownies ? 'got your Town Rep application.' : 'we got your application. ✌️',
    text,
  });
}
