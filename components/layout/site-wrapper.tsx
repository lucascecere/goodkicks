'use client';

import { usePathname } from 'next/navigation';
import { CartProvider } from '@/lib/cart/cart-context';
import { Header } from './header';
import { Footer } from './footer';
import { ParentBanner } from './parent-banner';
import { CartDrawer } from './cart-drawer';
import { RotarySpin } from '@/components/townies/rotary-spin';
import { siteBrand } from '@/lib/brand/site-brand';
import { brandConfig } from '@/lib/brand/brands';

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

  // Brand = the /goodkicks path (Townies root domain) OR the goodkicks.co host.
  // On goodkicks.co the middleware rewrites "/" → /goodkicks, so the server
  // renders GK but the CLIENT usePathname() sees "/" — which used to flip the
  // Townies header back on after hydration. The server-provided `host` is the
  // reliable signal there, and siteBrand() weighs both.
  //
  // ONE header, ONE footer, for both brands. They read everything that differs
  // from the brand config, and every colour from the semantic tokens that
  // data-brand switches on the root div below — the shared CartDrawer included.
  const id = siteBrand(host, pathname);
  const brand = brandConfig(id);
  const isGoodKicks = id === 'goodkicks';

  return (
    <div data-brand={isGoodKicks ? 'goodkicks' : undefined} className="bg-bg text-text">
      <CartProvider>
        {brand.parentBanner && <ParentBanner />}
        <Header brand={brand} />
        <main id="main-content">{children}</main>
        <Footer brand={brand} />
        <CartDrawer brand={brand} />
        {/* Townies only — Good Kicks has its own offer story, and mixing the two
            brands' promotions in one popup is exactly the thing we don't do. */}
        {!isGoodKicks && <RotarySpin />}
      </CartProvider>
    </div>
  );
}
