import type { Metadata } from 'next';
import Link from 'next/link';
import { getTownieProducts } from '@/lib/shopify/collections';
import { groupByTown, groupByRegion, PLACEHOLDER_TOWNS, type TownView } from '@/lib/townies/towns';
import { TownCard } from '@/components/townies/town-card';
import { BrandPattern } from '@/components/townies/brand-pattern';
import { breadcrumbSchema } from '@/lib/seo/site';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Shop the Towns — Townies',
  description:
    'Every town, the town as hero. Massachusetts town-pride apparel grouped by region — starting with the South Shore.',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: 'Shop the Towns — Townies',
    description: 'Massachusetts town-pride apparel. Pick your town.',
    url: '/shop',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
};

export default async function ShopPage() {
  const products = await getTownieProducts();
  const live = groupByTown(products);
  const towns: TownView[] = live.length > 0 ? live : PLACEHOLDER_TOWNS;
  const groups = groupByRegion(towns);
  const isPlaceholder = live.length === 0;

  return (
    <div className="bg-town-cream min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Towns', path: '/shop' },
            ]),
          ),
        }}
      />
      {/* Header */}
      <div className="relative overflow-hidden">
        <BrandPattern variant="ma" color="forest" opacity={0.06} size={150} fade="b" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-10 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium mb-3">
            The towns
          </p>
          <h1 className="font-block uppercase text-5xl sm:text-7xl text-town-navy mb-4">
            Pick your town.
          </h1>
          <p className="text-town-muted max-w-md mx-auto leading-relaxed">
            Town-pride apparel, grouped by region. The town is the hero — Townies is just
            the label on the tag.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-24 space-y-16 sm:space-y-20">
        {groups.map((group) => (
          <section key={group.region} id={group.region} className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-block uppercase text-2xl sm:text-3xl text-town-navy whitespace-nowrap">
                {group.label}
              </h2>
              <div className="h-px flex-1 bg-town-rule" />
              <span className="text-xs uppercase tracking-[0.18em] text-town-muted">
                {group.towns.length} {group.towns.length === 1 ? 'town' : 'towns'}
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {group.towns.map((town, i) => (
                <TownCard key={town.id} town={town} priority={i < 2} />
              ))}
            </div>
          </section>
        ))}

        {/* Quiet empty / pre-launch note */}
        {isPlaceholder && (
          <p className="text-center text-town-muted text-sm">
            These towns are coming soon. {' '}
            <Link href="/contact" className="underline underline-offset-4 hover:text-town-forest">
              Request your town
            </Link>{' '}
            and we&apos;ll put it on the line.
          </p>
        )}
      </div>
    </div>
  );
}
