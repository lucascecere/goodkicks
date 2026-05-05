import { NextResponse } from 'next/server';
import { getShopInfo } from '@/lib/shopify/service';

export async function GET() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN ?? '(not set)';
  const tokenSet = !!(process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN && process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN !== 'placeholder-build-token');

  try {
    const shop = await getShopInfo();
    if (!shop) {
      return NextResponse.json({ connected: false, error: 'No shop data returned', domain, tokenSet }, { status: 500 });
    }
    return NextResponse.json({ connected: true, shop, domain, tokenSet });
  } catch (err) {
    return NextResponse.json({ connected: false, error: String(err), domain, tokenSet }, { status: 500 });
  }
}
