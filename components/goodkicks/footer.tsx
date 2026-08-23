'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { currentBrand } from '@/components/brand/current-brand';

const shopLinks = [
  { href: '/goodkicks/products/the-good-kick-georgia', label: 'georgia' },
  { href: '/goodkicks/products/the-good-kick-nevada', label: 'nevada' },
  { href: '/goodkicks/products/the-good-kick-colorado', label: 'colorado' },
  { href: '/goodkicks/products/the-good-kick-new-york', label: 'new york' },
  { href: '/goodkicks/products/the-good-kick-massachusetts', label: 'massachusetts' },
  { href: '/goodkicks/products/the-good-kick-maine', label: 'maine' },
];

const brandLinks = [
  { href: '/goodkicks#ambassadors', label: 'ambassador program' },
  { href: '/contact', label: 'contact' },
];

const helpLinks = [
  { href: '/shipping-returns', label: 'shipping & returns' },
  { href: '/privacy', label: 'privacy & terms' },
];

function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Brand-scoped so Good Kicks + Townies signups stay separate in Supabase.
        // Derived rather than hardcoded: this footer renders on goodkicks.co AND
        // on townies.shop/goodkicks, and the server can't tell those apart from
        // Host alone. (Until 2026-08-23 the server ignored this field entirely.)
        body: JSON.stringify({ email, brand: currentBrand() }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return <p className="text-white/60 text-sm">you&apos;re in. check your inbox for a welcome discount. ✌️</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        aria-label="Email address"
        className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-rust/50"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-brand-rust text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-brand-rust/90 transition-colors whitespace-nowrap disabled:opacity-60"
      >
        {status === 'loading' ? 'sending…' : 'get the discount'}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-xs mt-1 w-full">something went wrong — try again.</p>
      )}
    </form>
  );
}

export function GoodKicksFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-ink text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: logo + tagline */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-4">
            {/* Plain img: first-party SVG, avoids next/image SVG/CSP handling */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/goodkicks_logo_inverted.svg"
              alt="Good Kicks Foot Bags"
              width={120}
              height={120}
              className="mx-auto lg:mx-0"
              style={{ height: '120px', width: 'auto' }}
            />
            <p className="font-display text-2xl text-white/80">make the circle bigger<span className="text-[#C66A3D]">.</span></p>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              premium foot bags built for dorm circles, dining-hall tosses, and every backpack that needs one.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors pt-1"
            >
              visit Townies Apparel Co. <ArrowUpRight size={14} />
            </Link>
          </div>

          {/* Right: nav columns + subscribe */}
          <div className="flex flex-col gap-10 text-sm lg:pt-2">
            <div className="grid grid-cols-3 gap-8 text-center lg:text-left">
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-wider mb-4 font-medium">the sacks</h3>
                <ul className="space-y-3">
                  {shopLinks.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-white/70 hover:text-white transition-colors">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-wider mb-4 font-medium">brand</h3>
                <ul className="space-y-3">
                  {brandLinks.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-white/70 hover:text-white transition-colors">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-wider mb-4 font-medium">help</h3>
                <ul className="space-y-3">
                  {helpLinks.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-white/70 hover:text-white transition-colors">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-3 border-t border-white/10 pt-8">
              <p className="text-white text-sm font-medium uppercase tracking-wider">offers &amp; discounts</p>
              <p className="text-white/50 text-xs">subscribe for exclusive drops and discount codes.</p>
              <SubscribeForm />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-2 sm:flex-row sm:justify-between text-xs text-white/40">
          <p>© {year} Good Kicks Foot Bags</p>
          <a
            href="https://instagram.com/goodkicksco"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors tracking-wide"
          >
            @goodkicksco
          </a>
        </div>
        <div className="max-w-7xl mx-auto flex justify-end mt-2">
          <p className="text-[10px] text-white/20">
            managed by{' '}
            <a
              href="https://www.yourwebsitefriend.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors"
            >
              Your Website Friend
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
