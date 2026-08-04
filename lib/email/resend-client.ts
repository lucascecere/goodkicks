import { Resend } from 'resend';

// `||` (not `??`) so a blank env value falls back too. The Resend constructor
// throws on an empty key, and .env.production carries blank placeholders — with
// `??` that took the whole production build down at the "collect page data"
// step for every route importing an email sender. Real sends are already gated
// on RESEND_API_KEY being set.
export const resend = new Resend(process.env.RESEND_API_KEY || 'not-set');
