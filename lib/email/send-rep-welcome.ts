// Townies Town Rep welcome email.
//
// Deliberately separate from lib/email/send-welcome.ts (Good Kicks): the two
// programs have different economics. Good Kicks reps climb a tier ladder;
// Townies reps get a flat commission set per-person in the admin, so there is
// no "how you grow" ladder here to go stale.
//
// The body itself lives in ./rep-welcome-template (pure, client-importable) so
// the admin preview renders the exact text that gets sent.

import { sendEmail } from './resend-client';
import {
  renderRepWelcome,
  repWelcomeSubject,
  type RepWelcomeFields,
} from './rep-welcome-template';

// HARD RULE (Lucas): Townies mail goes out ONLY from info@townies.shop
// (verified in Resend). Hard-coded so no env var can send it as anything else.
const FROM_EMAIL = 'info@townies.shop';
export const TOWNIES_FROM = `Townies <${FROM_EMAIL}>`;

function safeEmail(email: string) {
  return process.env.NODE_ENV === 'production' ? email : 'delivered@resend.dev';
}

export async function sendRepWelcomeEmail({
  email,
  ...fields
}: RepWelcomeFields & { email: string }): Promise<string> {
  return sendEmail({
    from: TOWNIES_FROM,
    to: safeEmail(email),
    replyTo: FROM_EMAIL,
    subject: repWelcomeSubject(fields.firstName),
    text: renderRepWelcome(fields),
  });
}
