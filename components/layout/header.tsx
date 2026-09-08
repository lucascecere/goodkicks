'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, User } from 'lucide-react';
import { CartIconButton } from './cart-icon-button';
import { TownFinder } from '@/components/townies/town-finder';
import { cn } from '@/lib/utils';
import { SHOPIFY_ACCOUNT_URL } from '@/lib/shopify/account-url';
import type { BrandConfig } from '@/lib/brand/brands';

// The one header, for both brands. Every nav item is a flat link — the old
// seven-row Shop hover panel cost a hover and a read to reach the page most
// visitors came for. Regions are filter pills on /shop and links in the footer.
//
// Colours are semantic (text / accent / bg / rule), so the same bar is navy-on-
// cream for Townies and ink-on-cream for Good Kicks with no branching here.

const navClass =
  'text-xs uppercase tracking-[0.18em] text-text/75 hover:text-accent transition-colors';

export function Header({ brand }: { brand: BrandConfig }) {
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

  const home = brand.base || '/';
  const isActive = (href: string) => {
    const path = href.split('#')[0];
    if (path === '/' || path === brand.base) return pathname === path;
    return pathname.startsWith(path);
  };

  const logo = brand.logo.light;

  return (
    <header className="sticky top-0 z-50">
      {/* SOLID at every scroll position. It used to fade in from transparent,
          which put navy nav text over the dark homepage hero — legible on
          paper, invisible in practice. */}
      <div
        className={cn(
          'bg-bg border-b transition-shadow duration-300',
          scrolled ? 'border-rule shadow-[0_1px_16px_rgba(0,0,0,0.07)]' : 'border-rule/60',
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[4.5rem] flex items-center justify-between gap-4">
          {/* Left: mobile hamburger + wordmark */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 -ml-2 text-text hover:text-accent transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href={home} aria-label={`${brand.name} — home`} className="inline-flex">
              <Image
                src={logo.src}
                width={logo.w}
                height={logo.h}
                alt={logo.alt}
                priority
                className={cn('max-w-full', brand.logoClass)}
              />
            </Link>
          </div>

          {/* Center: nav */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
            {brand.nav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(navClass, 'py-2', isActive(link.href) && 'text-accent')}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: utility icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {brand.finder ? (
              <TownFinder />
            ) : (
              <Link
                href={brand.shopPath}
                aria-label="Search the shop"
                className="p-2 text-text hover:text-accent transition-colors"
              >
                <Search size={19} />
              </Link>
            )}
            <a
              href={SHOPIFY_ACCOUNT_URL}
              aria-label="Account"
              className="hidden sm:inline-flex p-2 text-text hover:text-accent transition-colors"
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
          className="lg:hidden bg-bg border-b border-rule px-4 pb-5 pt-1 flex flex-col max-h-[calc(100vh-4rem)] overflow-y-auto"
          aria-label="Mobile navigation"
        >
          {[...brand.nav, ...brand.mobileExtra].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3 text-sm uppercase tracking-[0.15em] text-text hover:text-accent transition-colors border-b border-rule/60"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={brand.crossBrand.href}
            className="py-3 text-sm uppercase tracking-[0.15em] text-muted hover:text-accent transition-colors"
          >
            {brand.crossBrand.label}
          </Link>
        </nav>
      )}
    </header>
  );
}
