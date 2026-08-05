import { sendEmail } from '@/lib/email/resend-client';
import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { upsertContact } from '@/lib/supabase/upsert-contact';
import { Resend } from 'resend';

export const runtime = 'nodejs';

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return new Response('Missing signature or secret', { status: 400 });
  }

  let event;
  try {
    const rawBody = Buffer.from(await req.arrayBuffer());
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return Response.json({ received: true });
  }

  const session = event.data.object;
  const supabase = createSupabaseServiceClient();

  // Resolve ambassador promo code string (e.g. "OHIO20") from the session discounts
  let promoCode: string | null = null;
  const firstDiscount = (session.discounts as Array<{ promotion_code?: string | null }> | null)?.[0];
  const promoCodeId = firstDiscount?.promotion_code;
  if (promoCodeId && typeof promoCodeId === 'string') {
    try {
      const promo = await stripe.promotionCodes.retrieve(promoCodeId);
      promoCode = promo.code;
    } catch {
      // Non-fatal — order still saves without it
    }
  }

  // Save order
  const { error: dbError } = await supabase.from('orders').insert({
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent,
    customer_email: session.customer_details?.email ?? '',
    customer_name: session.customer_details?.name ?? '',
    shipping_address: session.customer_details?.address ?? {},
    line_items: JSON.parse((session.metadata?.cart as string) ?? '[]'),
    amount_total: session.amount_total ?? 0,
    currency: session.currency ?? 'usd',
    status: 'paid',
    promo_code: promoCode,
  });

  if (dbError && !dbError.message.includes('unique')) {
    console.error('[webhook] DB insert error:', dbError);
  }

  if (session.customer_details?.email) {
    await upsertContact({
      email: session.customer_details.email,
      name: session.customer_details.name ?? undefined,
      source: 'order',
    });
  }

  // Send confirmation email
  if (process.env.RESEND_API_KEY && session.customer_details?.email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const name = session.customer_details.name ?? 'friend';
      const total = formatCents(session.amount_total ?? 0);
      await sendEmail({
        from: 'Good Kicks <info@goodkicks.co>',
        to: session.customer_details.email,
        subject: 'Your Good Kicks order is confirmed!',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1C1917">
            <h2 style="font-size:24px;margin-bottom:8px">order confirmed. ✌️</h2>
            <p>Hey ${name}, thanks for keeping the circle going.</p>
            <p>Your foot bag ships in <strong>1–2 weeks</strong> from NH. You'll get another email with your tracking number when it's on the way.</p>
            <p style="font-size:18px;font-weight:bold;margin-top:24px">Order total: ${total}</p>
            <hr style="border:none;border-top:1px solid #E5DDD0;margin:24px 0" />
            <p style="color:#78716C;font-size:14px">Questions? Reply to this email or visit <a href="https://goodkicks.co/contact" style="color:#C0541A">goodkicks.co/contact</a></p>
            <p style="color:#78716C;font-size:14px">— The Good Kicks Team</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[webhook] Email send failed:', emailErr);
    }
  }

  return Response.json({ received: true });
}
