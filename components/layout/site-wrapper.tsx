'use client';

import { usePathname } from 'next/navigation';
import { CartProvider } from '@/lib/cart/cart-context';
import { Header } from './header';
import { Footer } from './footer';
import { CartDrawer } from './cart-drawer';
import { RotarySpin } from '@/components/townies/rotary-spin';
import { siteBrand } from '@/lib/brand/site-brand';

export function SiteWrapper({
  children,
  host = '',
}: {
  children: React.ReactNode;
  host?: string;
}) {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Good Kicks is a scoped mini-site: suppress Townies chrome (its own header/
  // footer come from app/goodkicks/layout.tsx) but KEEP the shared CartProvider +
  // CartDrawer so the cart is shared across both brands. data-brand scopes the
  // semantic CSS vars for the whole subtree — including the shared CartDrawer.
  //
  // Brand = the /goodkicks path (Townies root domain) OR the goodkicks.co host.
  // On goodkicks.co the middleware rewrites "/" → /goodkicks, so the server
  // renders GK but the CLIENT usePathname() sees "/" — which used to flip the
  // Townies header back on after hydration. The server-provided `host` is the
  // reliable signal there, and siteBrand() weighs both.
  const isGoodKicks = siteBrand(host, pathname) === 'goodkicks';

  return (
    <div data-brand={isGoodKicks ? 'goodkicks' : undefined}>
      <CartProvider>
        {!isGoodKicks && <Header />}
        <main id="main-content">{children}</main>
        {!isGoodKicks && <Footer />}
        <CartDrawer />
        {/* Townies only — Good Kicks has its own offer story, and mixing the two
            brands' promotions in one popup is exactly the thing we don't do. */}
        {!isGoodKicks && <RotarySpin />}
      </CartProvider>
    </div>
  );
}
