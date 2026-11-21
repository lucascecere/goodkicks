import type { Metadata } from 'next';
import Link from 'next/link';
import { getTownieProducts } from '@/lib/shopify/collections';
import { townPages } from '@/lib/townies/towns';
import { ProductCard } from '@/components/townies/product-card';
import { PageMasthead } from '@/components/townies/page-masthead';
import { TownLinks } from '@/components/townies/town-links';
import { RequestTownBand } from '@/components/townies/request-town-band';
import { FaqSection } from '@/components/ui/faq-section';
import { getReviewSummaries } from '@/lib/reviews/server';
import { SITE_URL, breadcrumbSchema } from '@/lib/seo/site';
import { sortByStock, stockTier } from '@/lib/townies/stock-tier';
import { christmasOrderBy } from '@/lib/townies/preorder';
import { TOWNIES } from '@/lib/brand/brands';

/**
 * /gifts: "Massachusetts town gifts".
 *
 * Nothing on the site answered gift searches ("gift for someone from
 * dorchester", "massachusetts gifts", "boston neighborhood gifts"), and the
 * sales data says a real share of orders ship away from the hat's own town:
 * people buying for someone who moved. This page is for them. Every hat, in
 * stock first, with the Christmas order-by date from the same logic the product
 * pages use.
 */

export const revalidate = 60;

const FREE_OVER = `$${(TOWNIES.freeShippingCents ?? 7500) / 100}`;

export const metadata: Metadata = {
  title: 'Massachusetts Town Gifts | Embroidered Hats for Every Town',
  description:
    'Gifts for someone from Dorchester, Quincy, Milton, Needham and more: embroidered Massachusetts town and Boston neighborhood hats, designed in Massachusetts.',
  alternates: { canonical: '/gifts' },
  openGraph: {
    title: 'Massachusetts Town Gifts | Townies',
    description: 'Embroidered hats for Massachusetts towns and Boston neighborhoods. The gift for the one who moved away.',
    url: '/gifts',
  },
};

function fmt(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York' });
}

export default async function GiftsPage() {
  const products = sortByStock(await getTownieProducts());
  const towns = townPages(products);
  const ratings = await getReviewSummaries();

  const anyInStock = products.find((p) => stockTier(p) === 0);
  const inStockBy = anyInStock ? christmasOrderBy(false, anyInStock.tags) : null;
  const preorderBy = (() => {
    const pre = products.find((p) => stockTier(p) === 1);
    return pre ? christmasOrderBy(true, pre.tags) : null;
  })();

  const townNames = towns.filter((t) => t.slug !== 'titletown').map((t) => t.name);
  const faqs = [
    {
      q: 'What is a good gift for someone from Massachusetts?',
      a: `Something with their town on it. Every Townies hat is embroidered with one Massachusetts town or Boston neighborhood, so it lands with the exact person it is for. Right now we make hats for ${townNames.join(', ')}.`,
    },
    {
      q: 'Will it arrive by Christmas?',
      a: inStockBy
        ? `In-stock hats leave our hands in 1 to 3 business days. Order by ${fmt(inStockBy)} to have an in-stock hat by Christmas. Pre-order hats are embroidered to order and take 2 to 4 weeks, so order those earlier; each hat's page shows its own date.`
        : 'In-stock hats leave our hands in 1 to 3 business days, and most arrive 3 to 7 business days after that. Pre-order hats are embroidered to order and take 2 to 4 weeks.',
    },
    {
      q: 'Can I ship it straight to them?',
      a: 'Yes. Put their address in at checkout and it goes straight to them. We ship anywhere in the US.',
    },
    {
      q: 'What if it does not fit?',
      a: 'It is one size fits most: an adjustable snapback that fits about 55 to 60cm of head circumference. You do not need to know their hat size.',
    },
    {
      q: 'How much is shipping?',
      a: `One in-stock hat ships for $5.95, and orders over ${FREE_OVER} ship free, so three hats ship free.`,
    },
  ];

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Massachusetts Town Gifts',
      url: `${SITE_URL}/gifts`,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: products.length,
        itemListElement: products.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/products/${p.handle}`,
          name: p.title,
        })),
      },
    },
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Gifts', path: '/gifts' },
    ]),
  ];

  return (
    <div className="bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <PageMasthead
        eyebrow="Gifts · Massachusetts"
        title="Massachusetts town gifts."
        sub="A hat with their town stitched on it. For the one who grew up in Dot and lives in Denver now, the dad who never left Quincy, and everyone in the group chat."
        pattern="pine"
        align="center"
      >
        {(inStockBy || preorderBy) && (
          <p className="mt-6 inline-block rounded-full border border-masthead-contrast/25 px-4 py-2 text-xs sm:text-sm text-masthead-contrast/90">
            {inStockBy ? (
              <>
                For Christmas: order in-stock hats by <strong className="font-semibold">{fmt(inStockBy)}</strong>
              </>
            ) : (
              <>
                For Christmas: order pre-order hats by <strong className="font-semibold">{fmt(preorderBy as Date)}</strong>
              </>
            )}
          </p>
        )}
      </PageMasthead>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-16 pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} rating={ratings[p.handle]} />
          ))}
        </div>
      </div>

      <section aria-labelledby="moved-away" className="bg-surface border-y border-rule">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-14 sm:py-20 text-center">
          <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-accent mb-3">
            For the one who moved away
          </p>
          <h2 id="moved-away" className="display text-[2rem] sm:text-[2.5rem] text-text mb-6">
            Their town, wherever they ended up.
          </h2>
          <div className="space-y-4 text-muted leading-relaxed">
            <p>
              Plenty of our hats ship a long way from the town on the front, to people who grew up there and live
              somewhere else now. It is a small thing that says you know exactly where they are from.
            </p>
            <p>
              Every hat is embroidered, not printed, on an adjustable snapback, so you do not need to know their size.
              Ship it straight to them from checkout.
            </p>
          </div>
        </div>
      </section>

      <nav aria-label="Shop by town" className="max-w-4xl mx-auto px-4 sm:px-8 py-14 sm:py-16 text-center">
        <TownLinks heading="Shop by town" towns={towns} align="center" />
        <p className="mt-8 text-sm text-muted">
          Don&apos;t see their town?{' '}
          <Link href="/request-a-town" className="inline-block py-2 underline underline-offset-4 hover:text-text">
            Request it
          </Link>
        </p>
      </nav>

      <FaqSection id="faq" eyebrow="Gift questions" title="Good to know." items={faqs} />

      <RequestTownBand />
    </div>
  );
}
