import { Resend } from 'resend';

// `||` (not `??`) so a blank env value falls back too. The Resend constructor
// throws on an empty key, and .env.production carries blank placeholders — with
// `??` that took the whole production build down at the "collect page data"
// step for every route importing an email sender. Real sends are already gated
// on RESEND_API_KEY being set.
export const resend = new Resend(process.env.RESEND_API_KEY || 'not-set');

export class ResendSendError extends Error {
  readonly statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ResendSendError';
    this.statusCode = statusCode;
  }
}

type SendPayload = Parameters<typeof resend.emails.send>[0];

/**
 * Send an email, failing loudly.
 *
 * `resend.emails.send()` does NOT throw when the API rejects a message — it
 * resolves with `{ data: null, error }`. Awaiting it without inspecting the
 * result makes a rejected send look exactly like a delivered one, which is how
 * a welcome email got recorded as sent while never reaching Resend at all.
 *
 * Always use this instead of calling `resend.emails.send` directly. Returns the
 * Resend message id so callers can store it as proof of delivery.
 */
export async function sendEmail(payload: SendPayload): Promise<string> {
  if (!process.env.RESEND_API_KEY) {
    throw new ResendSendError('RESEND_API_KEY is not set — no email was sent.');
  }

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    throw new ResendSendError(
      `${error.name ?? 'send failed'}: ${error.message ?? 'unknown Resend error'}`,
      (error as { statusCode?: number }).statusCode,
    );
  }
  if (!data?.id) {
    throw new ResendSendError('Resend accepted the request but returned no message id.');
  }

  return data.id;
}
