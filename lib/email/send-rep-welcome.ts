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

// Townies has no verified Resend sending domain yet, so mail goes out under the
// Good Kicks address with a Townies display name — the same compromise
// app/api/contact/route.ts already makes. Verify townies.shop in Resend, then
// set TOWNIES_FROM_EMAIL to flip this over with no code change.
const FROM_EMAIL = process.env.TOWNIES_FROM_EMAIL ?? 'info@goodkicks.co';
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
