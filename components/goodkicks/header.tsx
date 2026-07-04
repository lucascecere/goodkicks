'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { CartIconButton } from '@/components/layout/cart-icon-button';
import { cn } from '@/lib/utils';

// GK mini-site nav — all links stay inside the /goodkicks scope (or shared
// utility pages). "Townies" is the cross-brand link back to the parent brand.
const navLinks = [
  { href: '/goodkicks/shop', label: 'shop' },
  { href: '/goodkicks#ambassadors', label: 'ambassadors' },
  { href: '/contact', label: 'contact' },
];

export function GoodKicksHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-brand-cream/95 backdrop-blur-sm border-b border-brand-rule shadow-sm'
          : 'bg-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[10px] grid grid-cols-3 items-center">
        {/* Left: desktop nav / mobile hamburger */}
        <div className="flex items-center">
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm tracking-wide text-brand-ink/80 hover:text-brand-rust transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 text-brand-ink hover:text-brand-rust transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Center: logo */}
        <div className="flex justify-center">
          <Link href="/goodkicks" className="flex-shrink-0" aria-label="Good Kicks — home">
            <Image
              src="/brand/logo.png"
              alt="Good Kicks Foot Bags"
              width={80}
              height={80}
              style={{ height: '64px', width: 'auto' }}
              priority
            />
          </Link>
        </div>

        {/* Right: Townies cross-link + cart */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-0.5 text-xs uppercase tracking-[0.14em] text-brand-ink/60 hover:text-brand-ink transition-colors"
          >
            Townies <ArrowUpRight size={13} />
          </Link>
          <CartIconButton />
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav
          className="md:hidden bg-brand-cream border-t border-brand-rule px-4 pb-4 flex flex-col gap-1"
          aria-label="Mobile navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="py-3 text-brand-ink hover:text-brand-rust transition-colors border-b border-brand-rule/50"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="py-3 text-brand-ink/70 hover:text-brand-ink transition-colors border-b border-brand-rule/50 inline-flex items-center gap-1"
          >
            Townies <ArrowUpRight size={13} />
          </Link>
          <div className="pt-4 pb-1">
            <Link
              href="/goodkicks/shop"
              onClick={() => setMobileOpen(false)}
              className="block w-full bg-brand-rust text-white text-center py-3 rounded font-medium hover:bg-brand-rust/90 transition-colors"
            >
              shop the sacks
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
