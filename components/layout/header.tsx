'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Search, User } from 'lucide-react';
import { CartIconButton } from './cart-icon-button';
import { BrandLogo } from '@/components/brand/brand-logo';
import { cn } from '@/lib/utils';

// Region-led nav. South Shore is live (the shop); Boston + North Shore are
// coming-soon pages until those drops land.
const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/shop', label: 'Shop' },
  { href: '/contact', label: 'Contact' },
];

// Accounts + policies live on Shopify-hosted pages — link out.
const ACCOUNT_URL = 'https://goodkicks.myshopify.com/account';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-town-cream/95 backdrop-blur-sm border-b border-town-rule'
          : 'bg-town-cream/0 border-b border-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: mobile hamburger + script wordmark */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 -ml-2 text-town-navy hover:text-town-forest transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <BrandLogo variant="script" href="/" className="h-7 sm:h-8 w-auto" alt="Townies — home" priority />
        </div>

        {/* Center: nav */}
        <nav className="hidden md:flex items-center gap-9" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs uppercase tracking-[0.18em] text-town-navy/80 hover:text-town-forest transition-colors"
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

      {/* Mobile nav */}
      {mobileOpen && (
        <nav
          className="md:hidden bg-town-cream border-t border-town-rule px-4 pb-4 flex flex-col"
          aria-label="Mobile navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="py-3 text-sm uppercase tracking-[0.15em] text-town-navy hover:text-town-forest transition-colors border-b border-town-rule/60"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/goodkicks"
            onClick={() => setMobileOpen(false)}
            className="py-3 text-sm uppercase tracking-[0.15em] text-town-muted hover:text-town-forest transition-colors"
          >
            Good Kicks
          </Link>
        </nav>
      )}
    </header>
  );
}
