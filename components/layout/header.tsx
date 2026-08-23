'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, User } from 'lucide-react';
import { CartIconButton } from './cart-icon-button';
import { BrandLogo } from '@/components/brand/brand-logo';
import { cn } from '@/lib/utils';

// Every nav item is a flat link, Shop included.
//
// Shop used to open a seven-item hover panel — All towns / Clearance / Request
// your town, then the four regions with Live/Coming pills. It cost a hover and
// a read to reach the page most visitors came for, and one of its rows,
// "Clearance", 308-redirects to Good Kicks (middleware.ts), so it sent Townies
// shoppers to the other brand. Regions are still reachable: they are filter
// pills on /shop itself and links in the footer, which is where browsing
// belongs. One click to the shop, nothing to read on the way.
const navLinks = [
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
  // "Wholesale" only reads as "I want to stock you". Most of the volume is
  // teams, companies and fundraisers buying once, and they don't self-identify
  // as wholesale buyers — so the label leads with the job, not the trade term.
  { href: '/wholesale', label: 'Bulk Orders' },
  { href: '/support', label: 'Support' },
];

// Mobile gets the two extra destinations the desktop bar reaches by other
// means — the announcement bar carries Request your town, and Good Kicks has
// never been in the desktop nav.
const mobileExtraLinks = [
  { href: '/request-a-town', label: 'Request your town' },
];

// Accounts + policies live on Shopify-hosted pages — link out.
const ACCOUNT_URL = 'https://goodkicks.myshopify.com/account';

const navClass =
  'text-xs uppercase tracking-[0.18em] text-town-navy/75 hover:text-town-forest transition-colors';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Route change closes the drawer — otherwise it stays open over the new page.
  useEffect(() => setMobileOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement bar. Navy against the cream header gives the whole
          chrome a top edge and carries the two things worth saying before
          anyone scrolls. */}
      <div className="bg-town-navy text-town-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-center gap-6">
          <p className="text-[0.62rem] sm:text-[0.68rem] uppercase tracking-[0.2em] text-center">
            Free shipping over $75
            <span className="hidden sm:inline text-town-cream/40 mx-3">·</span>
            <span className="hidden sm:inline">New towns every month</span>
          </p>
          <Link
            href="/request-a-town"
            className="hidden lg:inline text-[0.68rem] uppercase tracking-[0.2em] text-town-cream/70 hover:text-white underline underline-offset-4 transition-colors whitespace-nowrap"
          >
            Request your town
          </Link>
        </div>
      </div>

      {/* The main bar is SOLID at every scroll position. It used to fade in
          from transparent, which put navy nav text over the dark homepage
          hero — legible on paper, invisible in practice. */}
      <div
        className={cn(
          'bg-town-cream border-b transition-shadow duration-300',
          scrolled ? 'border-town-rule shadow-[0_1px_16px_rgba(13,27,42,0.07)]' : 'border-town-rule/60',
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[4.5rem] flex items-center justify-between gap-4">
          {/* Left: mobile hamburger + script wordmark */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 -ml-2 text-town-navy hover:text-town-forest transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <BrandLogo variant="script" href="/" className="h-7 sm:h-9 w-auto" alt="Townies — home" priority />
          </div>

          {/* Center: nav */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(navClass, 'py-2', isActive(link.href) && 'text-town-forest')}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: utility icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/shop"
              aria-label="Search towns"
              className="p-2 text-town-navy hover:text-town-forest transition-colors"
            >
              <Search size={19} />
            </Link>
            <a
              href={ACCOUNT_URL}
              aria-label="Account"
              className="hidden sm:inline-flex p-2 text-town-navy hover:text-town-forest transition-colors"
            >
              <User size={19} />
            </a>
            <CartIconButton />
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav
          className="lg:hidden bg-town-cream border-b border-town-rule px-4 pb-5 pt-1 flex flex-col max-h-[calc(100vh-6.5rem)] overflow-y-auto"
          aria-label="Mobile navigation"
        >
          {[...navLinks, ...mobileExtraLinks].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3 text-sm uppercase tracking-[0.15em] text-town-navy hover:text-town-forest transition-colors border-b border-town-rule/60"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/goodkicks"
            className="py-3 text-sm uppercase tracking-[0.15em] text-town-muted hover:text-town-forest transition-colors"
          >
            Good Kicks
          </Link>
        </nav>
      )}
    </header>
  );
}
