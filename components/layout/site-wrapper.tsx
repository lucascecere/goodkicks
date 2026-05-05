'use client';

import { usePathname } from 'next/navigation';
import { CartProvider } from '@/lib/cart/cart-context';
import { Header } from './header';
import { Footer } from './footer';
import { CartDrawer } from './cart-drawer';
import { SpinWheelPopup } from '@/components/home/spin-wheel-popup';

export function SiteWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <div className="bg-brand-ink text-white text-center py-2 px-4 text-xs tracking-wide">
        free shipping on orders $30+ &nbsp;·&nbsp; hand-stitched in every bag
      </div>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
      <CartDrawer />
      <SpinWheelPopup />
    </CartProvider>
  );
}
