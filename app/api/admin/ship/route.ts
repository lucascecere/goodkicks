import { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-password') !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId, trackingNumber } = await req.json();
  if (!orderId || !trackingNumber) {
    return Response.json({ error: 'orderId and trackingNumber required' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: order, error } = await supabase
    .from('orders')
    .update({ status: 'shipped', tracking_number: trackingNumber, shipped_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();

  if (error || !order) return Response.json({ error: 'Order not found' }, { status: 404 });

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Good Kicks <orders@goodkicks.co>',
        to: order.customer_email,
        subject: "Your Good Kicks is on the way! 🏐",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1C1917">
            <h2 style="font-size:24px;margin-bottom:8px">it's on its way. ✌️</h2>
            <p>Hey ${order.customer_name ?? 'friend'}, your foot bag just shipped!</p>
            <p style="font-size:16px"><strong>Tracking number:</strong> ${trackingNumber}</p>
            <p style="color:#78716C">Search your tracking number on the carrier's website to follow your package.</p>
            <hr style="border:none;border-top:1px solid #E5DDD0;margin:24px 0" />
            <p style="color:#78716C;font-size:14px">Questions? Visit <a href="https://goodkicks.co/contact" style="color:#C0541A">goodkicks.co/contact</a></p>
            <p style="color:#78716C;font-size:14px">— The Good Kicks Team</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[ship] Email failed:', emailErr);
    }
  }

  return Response.json({ ok: true });
}
