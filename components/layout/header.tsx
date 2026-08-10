'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, User, ChevronDown } from 'lucide-react';
import { CartIconButton } from './cart-icon-button';
import { BrandLogo } from '@/components/brand/brand-logo';
import { cn } from '@/lib/utils';

// Shop is the only nav item with depth — regions are how people actually look
// for their town, so they hang off Shop rather than competing with it in the
// top bar. Everything else is a flat link.
const REGIONS = [
  { href: '/south-shore', label: 'South Shore', note: 'Live' },
  { href: '/boston', label: 'Boston', note: 'Live' },
  { href: '/north-shore', label: 'North Shore', note: 'Coming' },
  { href: '/south-east', label: 'South East', note: 'Coming' },
];

const SHOP_LINKS = [
  { href: '/shop', label: 'All towns' },
  { href: '/clearance', label: 'Clearance' },
  { href: '/request-a-town', label: 'Request your town' },
];

const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/wholesale', label: 'Wholesale' },
  { href: '/support', label: 'Support' },
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
            {/* Shop + its dropdown. Opens on hover AND on keyboard focus
                (group-focus-within), so it needs no state and no JS. */}
            <div className="relative group">
              <Link
                href="/shop"
                className={cn(navClass, 'inline-flex items-center gap-1 py-2', isActive('/shop') && 'text-town-forest')}
              >
                Shop
                <ChevronDown size={13} className="mt-px transition-transform duration-200 group-hover:rotate-180" />
              </Link>
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 invisible translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0">
                <div className="w-[19rem] bg-white border border-town-rule rounded-sm shadow-[0_18px_50px_rgba(13,27,42,0.13)] p-2">
                  {SHOP_LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="block px-3 py-2 rounded-sm text-sm text-town-navy hover:bg-town-cream hover:text-town-forest transition-colors"
                    >
                      {l.label}
                    </Link>
                  ))}
                  <p className="px-3 pt-3 pb-1.5 mt-1 border-t border-town-rule text-[0.6rem] uppercase tracking-[0.2em] text-town-stone">
                    By region
                  </p>
                  {REGIONS.map((r) => (
                    <Link
                      key={r.href}
                      href={r.href}
                      className="flex items-center justify-between px-3 py-2 rounded-sm text-sm text-town-navy hover:bg-town-cream hover:text-town-forest transition-colors"
                    >
                      {r.label}
                      <span
                        className={cn(
                          'text-[0.55rem] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full',
                          r.note === 'Live'
                            ? 'bg-town-forest/10 text-town-forest'
                            : 'bg-town-stone/15 text-town-stone',
                        )}
                      >
                        {r.note}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

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
          {SHOP_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3 text-sm uppercase tracking-[0.15em] text-town-navy hover:text-town-forest transition-colors border-b border-town-rule/60"
            >
              {link.label}
            </Link>
          ))}
          <p className="pt-4 pb-1 text-[0.6rem] uppercase tracking-[0.2em] text-town-stone">By region</p>
          {REGIONS.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="py-2.5 text-sm uppercase tracking-[0.15em] text-town-navy hover:text-town-forest transition-colors flex items-center justify-between"
            >
              {r.label}
              <span className="text-[0.55rem] uppercase tracking-[0.14em] text-town-stone">{r.note}</span>
            </Link>
          ))}
          <p className="pt-4 pb-1 text-[0.6rem] uppercase tracking-[0.2em] text-town-stone">More</p>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-2.5 text-sm uppercase tracking-[0.15em] text-town-navy hover:text-town-forest transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/goodkicks"
            className="py-2.5 text-sm uppercase tracking-[0.15em] text-town-muted hover:text-town-forest transition-colors"
          >
            Good Kicks
          </Link>
        </nav>
      )}
    </header>
  );
}
