import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { getTownieProducts } from '@/lib/shopify/collections';
import { townPages } from '@/lib/townies/towns';
import { PageMasthead } from '@/components/townies/page-masthead';
import { GiveawayForm, type GiveawayTown } from '@/components/forms/giveaway-form';
import { GIVEAWAY, giveawayOpen } from '@/lib/townies/giveaway';

// /giveaway: website entry for the town hat giveaway (one free hat per town).
// Linked from the Instagram post, the bio and paid boosts. Temporary page: kept
// out of the sitemap, noindex.

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Giveaway: Win Your Town’s Hat',
  description: 'One free Townies hat for every town. Pick your town and enter. Winners picked Monday, Dec 7.',
  alternates: { canonical: '/giveaway' },
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Win your town’s hat | Townies',
    description: 'One free hat for every town. Pick your town and enter.',
    url: '/giveaway',
    images: [{ url: '/brand/scene/giveaway-norwood.jpg', width: 1100, height: 1366 }],
  },
};

export default async function GiveawayPage() {
  const towns: GiveawayTown[] = townPages(await getTownieProducts()).map((t) => ({
    slug: t.slug,
    name: t.name,
    image: t.products[0]?.featuredImage?.url ?? null,
  }));
  const open = giveawayOpen();

  return (
    <div className="bg-bg">
      <PageMasthead
        eyebrow={open ? 'Giveaway · enter by Sunday, Dec 6' : 'Giveaway · closed'}
        title="Win your town’s hat."
        sub={`One free hat for every town we make. Pick your town and enter. We pick one winner per town on ${GIVEAWAY.pickLabel}.`}
        pattern="topo"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
        <div>
          {open ? (
            <Suspense fallback={null}>
              <GiveawayForm towns={towns} />
            </Suspense>
          ) : (
            <div className="py-10">
              <p className="font-heading uppercase text-3xl text-text">This giveaway has closed.</p>
              <p className="text-muted mt-3">
                Winners were picked on {GIVEAWAY.pickLabel} and emailed. Thanks to everyone who entered.{' '}
                <Link href="/shop" className="underline underline-offset-4 hover:text-text">Shop every town</Link>.
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          {/* Generated from real photos of the Norwood hat (same scene as the Instagram post). */}
          <img
            src="/brand/scene/giveaway-norwood.jpg"
            alt="The Norwood hat on a wrapped gift box"
            width={1100}
            height={1366}
            className="w-full h-auto rounded-sm"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted mb-3">How it works</p>
            <ol className="space-y-2.5 text-sm text-text">
              <li><b>1.</b> Pick your town and enter with your email.</li>
              <li><b>2.</b> Want a second entry? Follow <a href="https://instagram.com/townies.shop" className="underline underline-offset-4">@townies.shop</a> and comment your town on the giveaway post.</li>
              <li><b>3.</b> One winner per town, picked {GIVEAWAY.pickLabel} and emailed that day.</li>
            </ol>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            No purchase necessary. US addresses only. One website entry per person per town. Entries close Sunday, Dec 6 at 11:59pm ET.
            In-stock hats ship to winners right away; made-to-order hats ship when they are made. Entering adds you to Townies emails;
            unsubscribe anytime. Not sponsored, endorsed or administered by Instagram.
          </p>
        </aside>
      </div>
    </div>
  );
}
