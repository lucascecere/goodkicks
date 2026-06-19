'use client';

import { usePathname } from 'next/navigation';
import { CartProvider } from '@/lib/cart/cart-context';
import { Header } from './header';
import { Footer } from './footer';
import { CartDrawer } from './cart-drawer';
import { BogoPopup } from '@/components/home/bogo-popup';

export function SiteWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <div className="bg-brand-rust text-white text-center py-2 px-4 text-xs tracking-wide font-medium">
        buy one get one free &nbsp;·&nbsp; use code <span className="font-mono font-bold tracking-widest">BOGOKICKS</span> at checkout
      </div>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
      <CartDrawer />
      <BogoPopup />
    </CartProvider>
  );
}
