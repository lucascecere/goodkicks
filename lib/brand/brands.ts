// The two storefronts, as data.
//
// Townies and Good Kicks share one Next app, one Shopify store, one cart and —
// since the September 2026 rebuild — one set of page components. What differs
// between them is written down here and nowhere else: name, logos, nav, footer
// columns, socials, and the few behaviours that are genuinely brand-specific
// (the parent-brand strip over Good Kicks, the newsletter box in its footer,
// whether the Massachusetts pattern set is allowed on a page).
//
// Colour and type are NOT here. They live in app/globals.css as the semantic
// token set under [data-brand], so a component never asks "which brand am I"
// to pick a colour — it uses `bg-ink` and the cascade answers.
//
// No 'use client' / 'server-only' on purpose: the header (client) and the page
// metadata (server) both read this.

import type { RealBrand } from '@/lib/admin/brand';

export type NavLink = { href: string; label: string; external?: boolean };

export type BrandLogo = { src: string; w: number; h: number; alt: string };

export type BrandConfig = {
  id: RealBrand;
  /** Short display name — "Townies". */
  name: string;
  /** The name that goes on the copyright line. */
  legalName: string;
  /** One line under the footer logo. */
  blurb: string;
  /** Root of this brand inside the app ('' for Townies, '/goodkicks' for GK). */
  base: string;
  shopPath: string;
  productBase: string;
  supportPath: string;
  /** Logo for light grounds (header) and dark grounds (footer, parent strip). */
  logo: { light: BrandLogo; dark: BrandLogo };
  /** Header wordmark height classes — the two marks have very different aspect ratios. */
  logoClass: string;
  nav: NavLink[];
  /** Extra destinations that only fit in the mobile drawer. */
  mobileExtra: NavLink[];
  /** The sister brand, offered quietly at the bottom of the mobile drawer. */
  crossBrand: NavLink;
  footer: {
    columns: Array<{ title: string; links: NavLink[] }>;
    socials: Array<{ label: 'Instagram' | 'Facebook' | 'TikTok'; href: string }>;
    /** The newsletter box at the foot of the footer. */
    subscribe: { title: string; body: string } | null;
  };
  /** Header search opens the town finder (Townies) rather than linking to the shop. */
  finder: boolean;
  /** Free-shipping threshold for the cart progress bar; null when shipping is always free. */
  freeShippingCents: number | null;
  /** Show the "A Townies Brand" strip above the header. */
  parentBanner: boolean;
  /** Whether the MA / pine / topo / speckle tiles may be used on this brand. */
  patterns: boolean;
};

const ACCOUNT = 'https://shopify.com/76213584027/account';

// Cross-brand links out of Good Kicks are ABSOLUTE. On goodkicks.co the
// middleware rewrites every relative path into the /goodkicks subtree, so a
// footer link to '/about' there lands on Good Kicks' home, not Townies' story.
const TOWNIES_URL = process.env.NEXT_PUBLIC_TOWNIES_URL ?? 'https://townies.shop';

export const TOWNIES: BrandConfig = {
  id: 'townies',
  name: 'Townies',
  legalName: 'Townies Apparel Co.',
  blurb: 'Town-pride apparel for real Massholes.',
  base: '',
  shopPath: '/shop',
  productBase: '/products',
  supportPath: '/support',
  logo: {
    light: { src: '/brand/logos/script-word.png', w: 420, h: 159, alt: 'Townies' },
    dark: { src: '/brand/logos/script-cream.png', w: 426, h: 214, alt: 'Townies Apparel Co.' },
  },
  logoClass: 'h-7 sm:h-9 w-auto',
  nav: [
    { href: '/shop', label: 'Shop' },
    { href: '/about', label: 'About' },
    // "Wholesale" only reads as "I want to stock you". Most of the volume is
    // teams, companies and fundraisers buying once, so the label leads with
    // the job, not the trade term.
    { href: '/wholesale', label: 'Bulk Orders' },
    { href: '/support', label: 'Support' },
  ],
  mobileExtra: [{ href: '/request-a-town', label: 'Request your town' }],
  crossBrand: { href: '/goodkicks', label: 'Good Kicks' },
  footer: {
    columns: [
      {
        // The footer is the only place the regions are listed — the header's
        // Shop dropdown that used to carry them is gone.
        title: 'Shop By',
        links: [
          { href: '/shop', label: 'All Towns' },
          { href: '/south-shore', label: 'South Shore' },
          { href: '/boston', label: 'Boston' },
          { href: '/south-east', label: 'Southeastern Mass' },
          { href: '/north-shore', label: 'North Shore' },
          { href: '/goodkicks', label: 'Good Kicks' },
        ],
      },
      {
        title: 'About',
        links: [
          { href: '/about', label: 'Our Story' },
          { href: '/request-a-town', label: 'Request Your Town' },
          { href: '/wholesale', label: 'Bulk Orders' },
          { href: '/ambassadors', label: 'Become an Ambassador' },
          { href: '/blog', label: 'The Town Paper' },
        ],
      },
      {
        title: 'Customer Service',
        links: [
          { href: ACCOUNT, label: 'Account', external: true },
          { href: '/size-guide', label: 'Size Guide' },
          { href: '/shipping-returns', label: 'Shipping & Returns' },
          { href: '/faq', label: 'FAQ' },
          { href: '/support', label: 'Support' },
        ],
      },
      { title: 'Terms', links: [{ href: '/privacy', label: 'Privacy & Terms' }] },
    ],
    // @townies.shop is the handle printed on every Content Studio graphic, so
    // it is the one the footer points at. No Facebook: Meta blocks the page
    // from being created, so there is nothing to link.
    socials: [
      { label: 'Instagram', href: 'https://instagram.com/townies.shop' },
      { label: 'TikTok', href: 'https://tiktok.com/@townies.shop' },
    ],
    subscribe: {
      title: 'New towns, first',
      body: 'Hear about the next drop before the group chat does.',
    },
  },
  finder: true,
  freeShippingCents: 7500,
  parentBanner: false,
  patterns: true,
};

export const GOODKICKS: BrandConfig = {
  id: 'goodkicks',
  name: 'Good Kicks',
  legalName: 'Good Kicks Foot Bags',
  blurb: 'premium foot bags built for dorm circles, dining-hall tosses, and every backpack that needs one.',
  base: '/goodkicks',
  shopPath: '/goodkicks/shop',
  productBase: '/goodkicks/products',
  supportPath: '/goodkicks/support',
  logo: {
    // The mascot is square, so it runs taller than the Townies script at the
    // same header height. The header handles that with logoClass below.
    light: { src: '/brand/goodkicks/logo.webp', w: 320, h: 320, alt: 'Good Kicks Foot Bags' },
    dark: { src: '/goodkicks_logo_inverted.svg', w: 120, h: 120, alt: 'Good Kicks Foot Bags' },
  },
  logoClass: 'h-11 sm:h-14 w-auto',
  nav: [
    { href: '/goodkicks/shop', label: 'Shop' },
    { href: '/goodkicks#ambassadors', label: 'Ambassadors' },
    { href: '/goodkicks#faq', label: 'FAQ' },
    { href: '/goodkicks/support', label: 'Support' },
  ],
  mobileExtra: [],
  crossBrand: { href: TOWNIES_URL, label: 'Townies' },
  footer: {
    columns: [
      {
        title: 'Shop',
        links: [
          { href: '/goodkicks/shop', label: 'All Sacks' },
          { href: '/goodkicks#the-good-kick', label: 'The Good Kick' },
          { href: `${TOWNIES_URL}/shop`, label: 'Townies Hats' },
        ],
      },
      {
        title: 'About',
        links: [
          { href: '/goodkicks#ambassadors', label: 'Ambassador Program' },
          { href: '/goodkicks#faq', label: 'FAQ' },
          { href: `${TOWNIES_URL}/about`, label: 'Our Story' },
        ],
      },
      {
        title: 'Customer Service',
        links: [
          { href: ACCOUNT, label: 'Account', external: true },
          { href: '/goodkicks/shipping-returns', label: 'Shipping & Returns' },
          { href: '/goodkicks/support', label: 'Support' },
        ],
      },
      { title: 'Terms', links: [{ href: '/goodkicks/privacy', label: 'Privacy & Terms' }] },
    ],
    socials: [{ label: 'Instagram', href: 'https://instagram.com/goodkicksco' }],
    subscribe: {
      title: 'Offers & discounts',
      body: 'Subscribe for new colorways and offers.',
    },
  },
  finder: false,
  freeShippingCents: null,
  parentBanner: true,
  patterns: false,
};

export const BRANDS: Record<RealBrand, BrandConfig> = { townies: TOWNIES, goodkicks: GOODKICKS };

export function brandConfig(id: RealBrand): BrandConfig {
  return BRANDS[id];
}
