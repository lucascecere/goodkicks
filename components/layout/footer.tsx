'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MaMark } from '@/components/brand/wordmark';
import { BrandLogo } from '@/components/brand/brand-logo';
import { SocialLinks } from '@/components/townies/social-links';

// The footer is now the only place the regions are listed — the header's Shop
// dropdown that used to carry them is gone, so North Shore is here rather than
// being reachable from nowhere at all.
const shopByLinks = [
  { href: '/shop', label: 'All Towns' },
  { href: '/south-shore', label: 'South Shore' },
  { href: '/boston', label: 'Boston' },
  { href: '/south-east', label: 'Southeastern Mass' },
  { href: '/north-shore', label: 'North Shore' },
  { href: '/goodkicks', label: 'Good Kicks' },
];

const aboutLinks = [
  { href: '/about', label: 'Our Story' },
  { href: '/request-a-town', label: 'Request Your Town' },
  { href: '/wholesale', label: 'Bulk Orders' },
  { href: '/ambassadors', label: 'Become an Ambassador' },
  // /blog had zero internal links anywhere in the app — it existed only in
  // sitemap.ts, so nothing on the site led to it.
  { href: '/blog', label: 'The Town Paper' },
];

const serviceLinks = [
  { href: 'https://goodkicks.myshopify.com/account', label: 'Account', external: true },
  { href: '/size-guide', label: 'Size Guide' },
  { href: '/shipping-returns', label: 'Shipping & Returns' },
  { href: '/faq', label: 'FAQ' },
  { href: '/support', label: 'Support' },
];

const termsLinks = [
  { href: '/privacy', label: 'Privacy & Terms' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-town-navy text-white">
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
