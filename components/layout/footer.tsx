'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const shopLinks = [
  { href: '/', label: 'the good kick' },
];

const brandLinks = [
  { href: '/about', label: 'our story' },
  { href: '/contact', label: 'contact' },
];

const helpLinks = [
  { href: 'https://goodkicks.myshopify.com/policies/shipping-policy', label: 'shipping & returns', external: true },
  { href: 'https://goodkicks.myshopify.com/policies/privacy-policy', label: 'privacy & terms', external: true },
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
        body: JSON.stringify({ email }),
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

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-ink text-white">
      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: logo + tagline + subscribe */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Image
                src="/brand/logo.png"
                alt="Good Kicks Foot Bags"
                width={100}
                height={100}
                style={{ height: '100px', width: 'auto' }}
              />
              <p className="font-display text-2xl text-white/80">make the circle bigger.</p>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                hand-stitched foot bags built for dorm circles, dining-hall tosses, and every backpack that needs one.
              </p>
            </div>

            {/* Subscribe */}
            <div className="space-y-3">
              <p className="text-white text-sm font-medium uppercase tracking-wider">offers &amp; discounts</p>
              <p className="text-white/50 text-xs">subscribe for exclusive drops and discount codes.</p>
              <SubscribeForm />
            </div>
          </div>

          {/* Right: nav columns */}
          <div className="grid grid-cols-3 gap-8 text-sm lg:pt-2">
            <div>
              <h3 className="text-white/40 text-xs uppercase tracking-wider mb-4 font-medium">shop</h3>
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
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-white/40">
          <p>© {year} Good Kicks Foot Bags</p>
          <a
            href="https://instagram.com/goodkicks"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors tracking-wide"
          >
            @goodkicks
          </a>
        </div>
      </div>
    </footer>
  );
}
