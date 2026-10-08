'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MaMark } from '@/components/brand/wordmark';
import { LogoImg } from '@/components/brand/brand-logo';
import { SocialLinks } from '@/components/townies/social-links';
import { currentBrand } from '@/components/brand/current-brand';
import type { BrandConfig } from '@/lib/brand/brands';

// The one footer, for both brands. Columns, logo, socials and the copyright
// line come from the brand config; the ground is `ink`, which is navy for
// Townies and near-black for Good Kicks.

export function Footer({ brand }: { brand: BrandConfig }) {
  const year = new Date().getFullYear();
  const logo = brand.logo.footer ?? brand.logo.dark;

  return (
    <footer className="bg-foot text-foot-strong border-t border-rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <Link href={brand.base || '/'} aria-label={brand.legalName} className="inline-flex">
              <LogoImg logo={logo} className={brand.id === 'townies' ? 'w-44 h-auto' : 'w-24 h-auto'} />
            </Link>
            <p className="text-foot-contrast/60 text-sm leading-relaxed max-w-xs">{brand.blurb}</p>
          </div>

          {brand.footer.columns.map((col) => (
            <FooterCol key={col.title} title={col.title} links={col.links} />
          ))}
        </div>

        {brand.footer.subscribe && (
          <div className="mt-12 pt-8 border-t border-foot-contrast/15 grid gap-4 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-foot-strong text-sm font-medium uppercase tracking-[0.15em]">{brand.footer.subscribe.title}</p>
              <p className="text-foot-contrast/60 text-xs mt-1">{brand.footer.subscribe.body}</p>
            </div>
            <SubscribeForm />
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-foot-contrast/15 px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-3 sm:flex-row sm:justify-between text-xs text-foot-contrast/60">
          {/* The brand's own line with its socials beside it; the agency credit
              is pushed to the far right, where a build credit belongs. */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
            <p className="flex items-center gap-2">
              {brand.id === 'townies' && <MaMark className="h-3 w-auto text-foot-contrast/60" />}
              {brand.id === 'townies' ? 'Massachusetts · ' : ''}© {year} {brand.legalName}
            </p>
            <SocialLinks socials={brand.footer.socials} />
          </div>
          <a
            href="https://www.yourwebsitefriend.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded border border-foot-contrast/20 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-foot-contrast/60 hover:text-foot-strong hover:border-foot-contrast/40 transition-colors"
          >
            Managed by Your Website Friend
          </a>
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
      {/* An h2, not an h3: on a form page the footer is the first heading
          after the H1, and an h3 there is the heading-order failure every
          accessibility scan of the site reported. */}
      <h2 className="text-foot-contrast/60 text-[11px] uppercase tracking-[0.15em] mb-4 font-medium">
        {title}
      </h2>
      <ul className="space-y-3 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            {l.external ? (
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-foot-contrast/75 hover:text-foot-strong transition-colors">
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className="text-foot-contrast/75 hover:text-foot-strong transition-colors">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
        // Brand-scoped so Good Kicks + Townies signups stay separate. Derived
        // at submit time: this footer renders on goodkicks.co AND on
        // townies.shop/goodkicks, and the server can't tell those apart from
        // Host alone.
        body: JSON.stringify({ email, brand: currentBrand() }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return <p className="text-foot-contrast/70 text-sm">You&apos;re in.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md md:ml-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email address"
        className="flex-1 bg-foot-contrast/10 border border-foot-contrast/20 text-foot-strong placeholder:text-foot-contrast/40 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-accent text-accent-contrast px-5 py-2.5 rounded-sm text-[0.6875rem] font-semibold uppercase tracking-[0.14em] hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-60"
      >
        {status === 'loading' ? 'Sending…' : 'Sign up'}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-xs mt-1 w-full">Something went wrong — try again.</p>
      )}
    </form>
  );
}
