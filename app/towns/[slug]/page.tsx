import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTownieProducts } from '@/lib/shopify/collections';
import { hatStyle, regionHref, townHref, townPages, type TownPage } from '@/lib/townies/towns';
import { ProductCard } from '@/components/townies/product-card';
import { PageMasthead } from '@/components/townies/page-masthead';
import { RequestTownBand } from '@/components/townies/request-town-band';
import { TownLinks } from '@/components/townies/town-links';
import { SITE_URL, breadcrumbSchema } from '@/lib/seo/site';
import { customTownHref, hasCustomPage } from '@/lib/townies/custom-hats';

/**
 * One page per town — /towns/milton, /towns/west-roxbury.
 *
 * People search "milton ma hat", not "townies". A product page answers for one
 * hat; this answers for the town, collects every hat that carries its name,
 * and is what the town cards, the shop ticker and the header finder link to.
 * Towns come straight from the catalogue, so a new town's page exists the
 * moment its first hat is live in Shopify.
 */

export const revalidate = 60;

const GRID: Record<number, string> = {
  1: 'max-w-xs grid-cols-1',
  2: 'max-w-2xl',
  3: 'max-w-4xl lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};
export const dynamicParams = true;

async function findTown(slug: string): Promise<{ town: TownPage; all: TownPage[] } | null> {
  const all = townPages(await getTownieProducts());
  const town = all.find((t) => t.slug === slug);
  return town ? { town, all } : null;
}

export async function generateStaticParams() {
  const all = townPages(await getTownieProducts().catch(() => []));
  return all.map((t) => ({ slug: t.slug }));
}

function styleSummary(town: TownPage): string {
  const styles = new Set(town.products.map((p) => hatStyle(p.title)).filter(Boolean));
  if (styles.has('lifestyle') && styles.has('everyday')) return 'the Lifestyle two-tone and the Everyday';
  if (styles.has('everyday')) return 'the Everyday';
  return 'the Lifestyle two-tone';
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const found = await findTown(slug);
  if (!found) return { title: 'Town Not Found' };
  const { town } = found;
  const title = `${town.name}, MA Hats & Town Apparel`;
  const description = `${town.name}, Massachusetts town-pride hats from Townies Apparel Co. Shop ${styleSummary(town)}, stitched with ${town.name} on the front. Ships from Massachusetts.`;
  const image = town.products.find((p) => p.featuredImage?.url)?.featuredImage?.url;
  return {
    title,
    description,
    alternates: { canonical: townHref(town.slug) },
    openGraph: {
      title: `${title} | Townies`,
      description,
      url: townHref(town.slug),
      ...(image ? { images: [{ url: image, width: 1000, height: 1000, alt: `${town.name} hat by Townies` }] } : {}),
    },
  };
}

export default async function TownPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await findTown(slug);
  if (!found) notFound();
  const { town, all } = found;

  const neighbours = all.filter((t) => t.region === town.region && t.slug !== town.slug);
  const elsewhere = all.filter((t) => t.region !== town.region);
  const count = town.products.length;
  const url = `${SITE_URL}${townHref(town.slug)}`;

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${town.name}, MA Hats`,
      url,
      about: { '@type': 'Place', name: `${town.name}, Massachusetts` },
      isPartOf: { '@id': `${SITE_URL}/#website` },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: count,
        itemListElement: town.products.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/products/${p.handle}`,
          name: p.title,
        })),
      },
    },
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: town.regionLabel, path: regionHref(town.region) },
      { name: town.name, path: townHref(town.slug) },
    ]),
  ];

  return (
    <div className="bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <PageMasthead
        eyebrow={`${town.regionLabel} · Massachusetts`}
        title={`${town.name}, MA.`}
        sub={`${count === 1 ? 'The Townies hat' : count === 2 ? 'Both Townies hats' : `All ${count} Townies hats`} for ${town.name}: ${styleSummary(town)}, with ${town.name} stitched on the front.`}
        pattern="topo"
        align="center"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-16 pb-16">
        {/* Centred under the centred masthead — most towns have one or two hats,
            and a four-column grid would leave them hugging the left edge. */}
        <div className={`grid grid-cols-2 gap-4 sm:gap-6 mx-auto ${GRID[Math.min(count, 4)]}`}>
          {town.products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
        {hasCustomPage(town.slug) && (
          <p className="mt-10 text-center text-sm text-muted">
            Ordering for a business or team in {town.name}?{' '}
            <Link href={customTownHref(town.slug)} className="underline underline-offset-4 hover:text-text">
              Custom hats for {town.name}
            </Link>
          </p>
        )}
      </div>

      {(neighbours.length > 0 || elsewhere.length > 0) && (
        <nav aria-label="More towns" className="max-w-4xl mx-auto px-4 sm:px-8 pb-20 text-center">
          {neighbours.length > 0 && (
            <TownLinks heading={`More ${town.regionLabel} towns`} towns={neighbours} align="center" />
          )}
          {elsewhere.length > 0 && (
            <TownLinks heading="Every other town" towns={elsewhere} align="center" />
          )}
          <p className="mt-8 text-sm text-muted">
            <Link href={regionHref(town.region)} className="underline underline-offset-4 hover:text-text">
              Shop the {town.regionLabel}
            </Link>
            {' · '}
            <Link href="/shop" className="underline underline-offset-4 hover:text-text">
              Shop every town
            </Link>
          </p>
        </nav>
      )}

      <RequestTownBand />
    </div>
  );
}

