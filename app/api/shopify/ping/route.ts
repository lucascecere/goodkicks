import { NextResponse } from 'next/server';
import { getShopInfo } from '@/lib/shopify/service';

export async function GET() {
  try {
    const shop = await getShopInfo();
    if (!shop) {
      return NextResponse.json({ connected: false, error: 'No shop data returned' }, { status: 500 });
    }
    return NextResponse.json({ connected: true, shop });
  } catch (err) {
    return NextResponse.json({ connected: false, error: String(err) }, { status: 500 });
  }
}
