'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MaMark } from '@/components/brand/wordmark';
import { BrandLogo } from '@/components/brand/brand-logo';
import { BrandPattern } from '@/components/townies/brand-pattern';
import { SocialLinks } from '@/components/townies/social-links';

const shopByLinks = [
  { href: '/shop', label: 'All Towns' },
  { href: '/south-shore', label: 'South Shore' },
  { href: '/boston', label: 'Boston' },
  { href: '/south-east', label: 'Southeastern Mass' },
  { href: '/goodkicks', label: 'Good Kicks' },
];

const aboutLinks = [
  { href: '/about', label: 'Our Story' },
  { href: '/contact', label: 'Request Your Town' },
  { href: '/contact', label: 'Wholesale' },
];

const serviceLinks = [
  { href: 'https://goodkicks.myshopify.com/account', label: 'Account', external: true },
  { href: '/size-guide', label: 'Size Guide' },
  { href: '/shipping-returns', label: 'Shipping & Returns' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact Us' },
];

const termsLinks = [
  { href: '/privacy', label: 'Privacy & Terms' },
];

function SignupForm() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // brand-scoped so Townies + Good Kicks signups don't collide in Supabase
        body: JSON.stringify({ email, phone: phone || undefined, brand: 'townies' }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <p className="text-town-cream/70 text-sm">
        You&apos;re in. We&apos;ll holler the moment your town drops.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-sm">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          aria-label="Email address"
          className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-town-forest"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Mobile for SMS (optional)"
          aria-label="Mobile number for SMS"
          className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-town-forest"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-town-cream text-town-navy px-5 py-2.5 rounded text-sm font-semibold hover:bg-white transition-colors whitespace-nowrap disabled:opacity-60"
        >
          {status === 'loading' ? 'Joining…' : 'Join the list'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-red-300 text-xs">Something went wrong — try again.</p>
      )}
    </form>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-town-navy text-white">
      {/* Signup hook — town-list band */}
      <div id="join" className="relative overflow-hidden border-b border-white/10 scroll-mt-24">
        <BrandPattern variant="ma" color="cream" opacity={0.08} size={150} fade="radial" />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-8 py-16 sm:py-24 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-town-cream/60 mb-4">
            New towns · restocks · first dibs
          </p>
          <h2 className="font-block uppercase text-4xl sm:text-6xl mb-5">
            Join the town list.
          </h2>
          <p className="text-town-cream/70 max-w-md mx-auto mb-8 leading-relaxed">
            Be first when your town drops. New towns, restocks, and members-only stuff —
            straight to your inbox. No spam, no BS.
          </p>
          <div className="flex justify-center">
            <SignupForm />
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <BrandLogo variant="script-cream" href="/" className="w-24 h-auto" alt="Townies Apparel Co." />
            <p className="text-town-cream/50 text-sm leading-relaxed max-w-xs">
              Town-pride apparel for real Massholes.
            </p>
          </div>

          <FooterCol title="Shop By" links={shopByLinks} />
          <FooterCol title="About" links={aboutLinks} />
          <FooterCol title="Customer Service" links={serviceLinks} />
          <FooterCol title="Terms" links={termsLinks} />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-3 sm:flex-row sm:justify-between text-xs text-town-cream/40">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <p className="flex items-center gap-2">
              <MaMark className="h-3 w-auto text-town-cream/40" />
              Massachusetts · © {year} Townies Apparel Co.
            </p>
            <a
              href="https://www.yourwebsitefriend.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded border border-white/15 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-town-cream/40 hover:text-white hover:border-white/35 transition-colors"
            >
              Managed by Your Website Friend
            </a>
          </div>
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string; external?: boolean }>;
}) {
  return (
    <div>
      <h3 className="text-town-cream/40 text-[11px] uppercase tracking-[0.15em] mb-4 font-medium">
        {title}
      </h3>
      <ul className="space-y-3 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            {l.external ? (
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-town-cream/70 hover:text-white transition-colors">
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className="text-town-cream/70 hover:text-white transition-colors">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
