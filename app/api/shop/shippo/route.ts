import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db, updateOrder } from '@/lib/shop/db';
import { queueMarketReview } from '@/lib/shop/reviews';
import { isDelivered } from '@/lib/shop/shippo';

// Shippo tracking updates ("track_updated"). Shippo doesn't sign webhooks, so
// the URL carries a secret: register it in Shippo as
//   https://townies.shop/api/shop/shippo?token=<SHIPPO_WEBHOOK_TOKEN>
// The only thing this does is mark an order delivered, which is what the
// review email waits for.

function tokenOk(got: string | null): boolean {
  const want = process.env.SHIPPO_WEBHOOK_TOKEN ?? '';
  if (!want || !got || got.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

type TrackEvent = {
  event?: string;
  data?: {
    tracking_number?: string;
    tracking_status?: { status?: string; status_date?: string } | null;
  };
};

export async function POST(req: Request) {
  if (!tokenOk(new URL(req.url).searchParams.get('token'))) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as TrackEvent | null;
  const number = body?.data?.tracking_number;
  if (body?.event !== 'track_updated' || !number) return NextResponse.json({ ignored: true });
  if (!isDelivered(body.data?.tracking_status?.status)) return NextResponse.json({ ok: true });

  const { data: order } = await db()
    .from('shop_orders')
    .select('id, fulfillment')
    .eq('tracking_number', number)
    .maybeSingle();
  if (order && order.fulfillment === 'shipped') {
    const deliveredAt = body.data?.tracking_status?.status_date ?? new Date().toISOString();
    const updated = await updateOrder(order.id, { fulfillment: 'delivered', delivered_at: deliveredAt });
    await queueMarketReview(updated, 'delivered', new Date(deliveredAt));
  }
  return NextResponse.json({ ok: true });
}
