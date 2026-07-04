'use client';

import { usePathname } from 'next/navigation';
import { CartProvider } from '@/lib/cart/cart-context';
import { Header } from './header';
import { Footer } from './footer';
import { CartDrawer } from './cart-drawer';

export function SiteWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Good Kicks is a scoped mini-site: suppress Townies chrome (its own header/
  // footer come from app/goodkicks/layout.tsx) but KEEP the shared CartProvider +
  // CartDrawer so the cart is shared across both brands. data-brand scopes the
  // semantic CSS vars for the whole subtree — including the shared CartDrawer.
  const isGoodKicks = pathname === '/goodkicks' || pathname.startsWith('/goodkicks/');

  return (
    <div data-brand={isGoodKicks ? 'goodkicks' : undefined}>
      <CartProvider>
        {!isGoodKicks && <Header />}
        <main id="main-content">{children}</main>
        {!isGoodKicks && <Footer />}
        <CartDrawer />
      </CartProvider>
    </div>
  );
}
