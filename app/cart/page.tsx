import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { fetchCart } from '@/lib/cart/fetch-cart';
import { CART_COOKIE } from '@/lib/cart/cookies';
import { flattenCartLines } from '@/lib/shopify/transforms';
import { Price } from '@/components/ui/price';

export const metadata: Metadata = {
  title: 'Your Bag',
};

export default async function CartPage() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get(CART_COOKIE)?.value;
  const cart = cartId ? await fetchCart(cartId) : null;
  const items = cart ? flattenCartLines(cart) : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="font-display text-4xl text-brand-ink mb-8">your bag</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="text-6xl">🏐</div>
          <p className="text-brand-muted">your bag is empty.</p>
          <Link href="/" className="text-brand-rust hover:underline">
            find your kick →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.lineId} className="flex gap-4 border-b border-brand-rule pb-6">
              <div className="w-16 h-16 rounded bg-brand-rule flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-brand-ink">{item.title}</p>
                <p className="text-brand-muted text-sm">{item.variantTitle}</p>
                <p className="text-brand-muted text-sm">qty: {item.quantity}</p>
              </div>
              <Price money={item.lineTotal} className="text-brand-ink" />
            </div>
          ))}

          {cart && (
            <div className="pt-4 space-y-4">
              <div className="flex justify-between font-medium text-brand-ink">
                <span>subtotal</span>
                <Price money={cart.cost.subtotalAmount} />
              </div>
              <a
                href={cart.checkoutUrl}
                className="block w-full bg-brand-rust text-white text-center py-3.5 rounded font-medium hover:bg-brand-rust/90 transition-colors"
              >
                checkout →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
