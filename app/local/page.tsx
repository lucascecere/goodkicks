import type { Metadata } from 'next';
import Link from 'next/link';
import { getStalls, townSlug, townsOf } from '@/lib/shop/market';
import { MARKET_BASE } from '@/lib/shop/paths';
import { StallCard } from '@/components/market/stall-card';
import { TownFilter } from '@/components/market/town-filter';
import { PageMasthead } from '@/components/townies/page-masthead';

export const revalidate = 60;

const TITLE = 'The Local Market: Hats From Massachusetts Businesses';
const DESCRIPTION =
  'Custom embroidered hats from local Massachusetts businesses, made by Townies. Browse by town, buy straight from the business, ship it or pick it up.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: MARKET_BASE },
  openGraph: { title: `${TITLE} | Townies`, description: DESCRIPTION, url: MARKET_BASE },
};

export default async function MarketPage({ searchParams }: { searchParams: Promise<{ town?: string; payouts?: string }> }) {
  const { town, payouts } = await searchParams;
  const stalls = await getStalls();
  const towns = townsOf(stalls);
  const active = town && towns.some((t) => townSlug(t) === town) ? town : null;
  const shown = active ? stalls.filter((s) => s.seller.town && townSlug(s.seller.town) === active) : stalls;

  return (
    <>
      <PageMasthead
        eyebrow="The Local Market"
        title="Hats from the shops down the street."
        sub="Local businesses we make custom hats for, each with their own shop here. Pick a town, browse the shops, and buy straight from the business. Ship it, or pick it up at their door."
        pattern="topo"
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
        {payouts === 'connected' && (
          <p className="mb-8 border border-band/40 bg-band/5 px-5 py-4 text-text">You&rsquo;re connected. Payouts will land in the account you just set up.</p>
        )}
        {towns.length > 1 && (
          <div className="mb-8">
            <TownFilter towns={towns} active={active} />
          </div>
        )}

        {shown.length === 0 ? (
          <div className="border border-dashed border-rule px-6 py-16 text-center">
            <p className="display text-2xl text-text">The first shops are setting up.</p>
            <p className="mx-auto mt-3 max-w-md text-muted">The first local businesses open here soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-14">
            {shown.map((s, i) => (
              <StallCard key={s.seller.id} stall={s} priority={i < 3} />
            ))}
          </div>
        )}

        <div className="mt-16 grid gap-6 border-t border-rule pt-10 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="display text-2xl text-text">Own a local business?</p>
            <p className="mt-2 max-w-xl text-muted">
              We design and stitch your hats, stock them, ship every order and pay you your share. No minimums, no inventory on
              your end.
            </p>
          </div>
          <Link
            href={`${MARKET_BASE}/apply`}
            className="inline-flex items-center justify-center bg-accent px-6 py-3.5 font-label text-xs font-bold uppercase tracking-[0.16em] text-accent-contrast"
          >
            Join the market
          </Link>
        </div>
      </div>
    </>
  );
}
