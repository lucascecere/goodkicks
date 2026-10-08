import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTownieProducts } from '@/lib/shopify/collections';
import { regionHref, townHref, type TownPage } from '@/lib/townies/towns';
import { TOWN_FACTS } from '@/lib/townies/town-facts';
import {
  CUSTOM_HUB,
  CUSTOM_MAX,
  CUSTOM_MIN,
  CUSTOM_QUOTE_WINDOW,
  customTownHref,
  customTowns,
} from '@/lib/townies/custom-hats';
import { HatCard } from '@/components/townies/v2/hat-card';
import { ShelfHeader } from '@/components/townies/v2/shelf-header';
import {
  CardGrid,
  CustomClose,
  CustomHero,
  CustomTownLinks,
  HowItWorks,
  LABEL,
  Section,
  SectionHead,
  TheBlanks,
  WhatGoesOn,
} from '@/components/townies/v2/custom-hats';
import { SITE_URL, breadcrumbSchema } from '@/lib/seo/site';

/**
 * /custom-hats/<town>: custom embroidery for one town we already make hats
 * for. Each page carries things only that town has (its own hats from the
 * catalogue, its county, zips and a landmark) so it reads as a page about
 * the town, not the hub with the name swapped.
 */

export const revalidate = 60;
export const dynamicParams = true;

async function findTown(slug: string): Promise<{ town: TownPage; all: TownPage[] } | null> {
  const all = customTowns(await getTownieProducts().catch(() => []));
  const town = all.find((t) => t.slug === slug);
  return town ? { town, all } : null;
}

export async function generateStaticParams() {
  const all = customTowns(await getTownieProducts().catch(() => []));
  return all.map((t) => ({ town: t.slug }));
}

type Props = { params: Promise<{ town: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { town: slug } = await params;
  const found = await findTown(slug);
  if (!found) return { title: 'Town Not Found' };
  const { town } = found;
  const title = `Custom Embroidered Hats in ${town.name}, MA`;
  const description = `Custom embroidered hats for ${town.name} businesses, teams, schools and fundraisers. Your logo on a Townies snapback, ${CUSTOM_MIN} to ${CUSTOM_MAX} hats, priced within ${CUSTOM_QUOTE_WINDOW}.`;
  const path = customTownHref(town.slug);
  const image = town.products.find((p) => p.featuredImage?.url)?.featuredImage?.url;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | Townies`,
      description,
      url: path,
      images: image
        ? [{ url: image, width: 1000, height: 1000, alt: `${town.name} Townies snapback` }]
        : [{ url: '/brand/scene/bulk-order.jpg', width: 1600, height: 1200, alt: 'A pile of Townies snapbacks' }],
    },
  };
}

export default async function CustomTownPage({ params }: Props) {
  const { town: slug } = await params;
  const found = await findTown(slug);
  if (!found) notFound();
  const { town, all } = found;

  const facts = TOWN_FACTS[town.slug];
  const zip = facts?.zips[0];
  const neighbours = all.filter((t) => t.region === town.region && t.slug !== town.slug);
  const others = all.filter((t) => t.region !== town.region);
  const hasHats = town.products.length > 0;
  const place = `${town.name}, Massachusetts`;
  const path = customTownHref(town.slug);
  const url = `${SITE_URL}${path}`;

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${url}#service`,
      name: `Custom embroidered hats in ${town.name}, MA`,
      serviceType: 'Custom hat embroidery',
      url,
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: {
        '@type': 'Place',
        name: place,
        ...(facts?.zips.length
          ? { address: { '@type': 'PostalAddress', addressLocality: town.name, addressRegion: 'MA', postalCode: facts.zips[0], addressCountry: 'US' } }
          : {}),
      },
      isRelatedTo: { '@id': `${SITE_URL}${CUSTOM_HUB}#service` },
    },
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Custom Hats', path: CUSTOM_HUB },
      { name: town.name, path },
    ]),
  ];

  const factRows: Array<[string, string]> = facts
    ? [
        ['County', facts.county],
        ...(facts.founded ? ([['History', facts.founded]] as Array<[string, string]>) : []),
        [facts.zips.length > 1 ? 'Zip codes' : 'Zip code', facts.zips.join(', ')],
        ['Region', town.regionLabel],
      ]
    : [['Region', town.regionLabel]];

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />

      <nav aria-label="Breadcrumb" className="mx-auto max-w-[1320px] px-4 pt-6 pb-2 sm:px-8">
        <ol className="flex flex-wrap gap-2 text-[0.8125rem] text-muted">
          <li>
            <Link href={CUSTOM_HUB} className="hover:text-text underline underline-offset-4">
              Custom hats
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-text">{town.name}</li>
        </ol>
      </nav>

      <CustomHero
        eyebrow={`Custom hats · ${town.regionLabel}`}
        title={`Custom hats for ${town.name}.`}
        lead={
          <>
            {town.name} businesses, teams and schools: your logo, embroidered on the same hats we make{' '}
            {hasHats ? `our ${town.name} hats on` : 'our town hats on'}. {CUSTOM_MIN} to {CUSTOM_MAX} hats, priced within{' '}
            {CUSTOM_QUOTE_WINDOW}.
          </>
        }
        image={{ src: '/brand/scene/bulk-order.jpg', alt: 'A pile of Braintree Townies snapbacks fresh from the embroiderer' }}
      />

      <Section ground>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <p className={LABEL}>About the town</p>
            <h2 className="display mt-3 text-[2rem] text-text sm:text-[2.5rem]">{town.name}, MA.</h2>
            {facts?.note && <p className="mt-3 text-[1rem] leading-relaxed text-muted">{facts.note}</p>}
          </div>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            {factRows.map(([k, v]) => (
              <div key={k} className="border-t border-text/20 pt-3">
                <dt className={LABEL}>{k}</dt>
                <dd className="mt-1 text-[1rem] text-text">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section>
        <SectionHead label={`In ${town.name}`} title={`Who we make them for.`} />
        <CardGrid
          cols={4}
          items={[
            {
              kicker: 'Businesses',
              title: `${town.name} shops and trades.`,
              body: 'Staff hats for the counter, the truck or the front desk, and a few extra for the regulars.',
            },
            {
              kicker: 'Teams',
              title: `${town.name} teams.`,
              body: `Youth, rec and men’s league, with the team on the front${zip ? ` and ${zip} on the side` : ' and the town on the side'}.`,
            },
            {
              kicker: 'Schools',
              title: `${town.name} schools.`,
              body: 'Booster clubs, PTOs, class gifts and reunions.',
            },
            {
              kicker: 'Events',
              title: `${town.name} fundraisers.`,
              body: 'Road races, town days, golf tournaments and the raffle table.',
            },
          ]}
        />
      </Section>

      {hasHats && (
        <section className="bg-white">
          <div className="mx-auto max-w-[1320px] px-4 pb-12 sm:px-8 sm:pb-16">
            <ShelfHeader
              title={`Our ${town.name} hats`}
              sub="Made for the town, embroidered the way yours would be."
              link={{ href: townHref(town.slug), label: `Shop ${town.name}` }}
            />
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
              {town.products.slice(0, 4).map((p) => (
                <HatCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <WhatGoesOn zip={zip} />

      <HowItWorks />

      <Section ground>
        <SectionHead label="The hats" title="Two blanks to choose from." />
        <TheBlanks />
      </Section>

      <Section>
        <SectionHead label="Nearby" title={neighbours.length > 0 ? `More of the ${town.regionLabel}.` : 'Other towns we make hats for.'} />
        <CustomTownLinks towns={neighbours.length > 0 ? neighbours : others} />
        <p className="mt-8 text-[0.9375rem] text-muted">
          {hasHats && (
            <>
              <Link href={townHref(town.slug)} className="text-text underline underline-offset-4">
                Shop {town.name} hats
              </Link>
              {' · '}
            </>
          )}
          <Link href={regionHref(town.region)} className="text-text underline underline-offset-4">
            Shop the {town.regionLabel}
          </Link>
          {' · '}
          <Link href={CUSTOM_HUB} className="text-text underline underline-offset-4">
            Custom hats across Massachusetts
          </Link>
        </p>
      </Section>

      <CustomClose
        title={`Put ${town.name} on it.`}
        sub={`Mock up your logo, then send it over. ${CUSTOM_MIN} to ${CUSTOM_MAX} hats, priced within ${CUSTOM_QUOTE_WINDOW}.`}
      />
    </div>
  );
}
