// Brand partners and their codes.
//
// A partner is NOT a rep. Reps are individuals who apply, get approved, earn a
// commission and receive a welcome email — all of which lives in
// `ambassador_applications`. A partner is a business we've agreed a cross-promo
// with: their code is minted once by hand, there's no application, usually no
// commission, and nothing to email. Filing one as a rep would mean inventing a
// town for it (the rep code is derived from the town), triggering the approve →
// mint → email flow against a code that already exists, and listing a business
// on a leaderboard of kids.
//
// So partners are a short config list here, and the revenue side reuses
// getRepStats() — the same engine, with its net-of-discount maths, that the rep
// leaderboard runs on. Adding a partner is one entry; no migration, no row.

import type { RealBrand } from '@/lib/admin/brand';

export type Partner = {
  /** Stable key, used for React keys and links. */
  id: string;
  name: string;
  /** Their Shopify discount code, as minted. Compared case-insensitively. */
  code: string;
  /** What the customer saves. */
  discountPct: number;
  /**
   * What the partner earns on net revenue. 0 for a straight cross-promo, which
   * is the usual shape: they get a perk for their followers, we get the
   * customers, no money changes hands.
   */
  commissionPct: number;
  /** Which brand's line items this partner is credited for. */
  brand: RealBrand;
  /** Logo in /public, for the admin row and the studio partner card. */
  logo?: string;
  /** Free text — what the partnership is. */
  note?: string;
};

export const PARTNERS: Partner[] = [
  {
    id: 'tl-elite',
    name: 'TL Elite Hockey',
    code: 'TLELITE10',
    discountPct: 10,
    commissionPct: 0,
    brand: 'townies',
    logo: '/brand/partners/tl-elite.png',
    note: 'Cross-promo. Townies makes their hats; they promote the code to their skaters and families.',
  },
];

export function partnersForBrand(brand: 'all' | RealBrand): Partner[] {
  return brand === 'all' ? PARTNERS : PARTNERS.filter((p) => p.brand === brand);
}
