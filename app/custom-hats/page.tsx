import type { Metadata } from 'next';
import Link from 'next/link';
import { getTownieProducts } from '@/lib/shopify/collections';
import { regionLabel } from '@/lib/townies/towns';
import {
  CUSTOM_BUILDER,
  CUSTOM_HUB,
  CUSTOM_MAX,
  CUSTOM_MIN,
  CUSTOM_QUOTE_WINDOW,
  customTowns,
} from '@/lib/townies/custom-hats';
import { HatCard } from '@/components/townies/v2/hat-card';
import { ShelfHeader } from '@/components/townies/v2/shelf-header';
import { CampaignBand } from '@/components/townies/campaign-band';
import {
  CardGrid,
  CustomClose,
  CustomHero,
  CustomTownLinks,
  FaqList,
  HowItWorks,
  Section,
  SectionHead,
  TheBlanks,
  WhatGoesOn,
  faqSchema,
  type Faq,
} from '@/components/townies/v2/custom-hats';
import { SITE_URL, breadcrumbSchema } from '@/lib/seo/site';

/**
 * The custom embroidery hub. Answers "custom embroidered hats Massachusetts"
 * and sends people to the builder (or, if they would rather talk, the bulk
 * form). The only numbers on this page are the two the bulk band already
 * states: 25 to 200 hats, priced within two business days.
 */

export const revalidate = 60;

const TITLE = 'Custom Embroidered Hats in Massachusetts';
const DESCRIPTION = `Custom embroidered hats for Massachusetts businesses, teams and schools. ${CUSTOM_MIN} to ${CUSTOM_MAX} hats, mock it up online, priced within ${CUSTOM_QUOTE_WINDOW}.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CUSTOM_HUB },
  openGraph: {
    title: `${TITLE} | Townies`,
    description: DESCRIPTION,
    url: CUSTOM_HUB,
    images: [{ url: '/brand/scene/bulk-order.jpg', width: 1600, height: 1200, alt: 'A pile of Braintree Townies snapbacks' }],
  },
};

const FAQS: Faq[] = [
  {
    q: 'How many hats do I need to order?',
    a: `Custom orders run from ${CUSTOM_MIN} to ${CUSTOM_MAX} hats. If you need a different number, ask through the bulk form anyway and we will tell you what we can do.`,
  },
  {
    q: 'How much do custom hats cost?',
    a: `It depends on the quantity, the hat and how much stitching goes on it, so every order is priced on its own. Send the details and you will have a price within ${CUSTOM_QUOTE_WINDOW}.`,
  },
  {
    q: 'Which hats can I choose from?',
    a: 'Blanks from Weld, Richardson and Yupoong: two-tone and solid 5-panel snapbacks, rope caps, flat-bill snapbacks and the classic truckers (Richardson 112, Yupoong 6006). The builder shows every colourway each maker sells.',
  },
  {
    q: 'Is the logo printed or embroidered?',
    a: 'Embroidered. Your logo is stitched directly onto the hat, the same way every Townies town hat is made.',
  },
  {
    q: 'What do I need to send you?',
    a: 'Your logo, the quantity, and which hat you want. A vector file (AI, EPS, SVG or PDF) is best for the logo, but a clear, large image is enough to start the conversation.',
  },
  {
    q: 'Can I see it before I order?',
    a: 'Yes. Start in the hat builder to see your logo on either hat. The order itself is settled over email, and nothing is made until you have agreed the price and the details.',
  },
  {
    q: 'How long does it take?',
    a: `It depends on the quantity and the time of year, so the lead time comes with your price, within ${CUSTOM_QUOTE_WINDOW} of asking.`,
  },
];

export default async function CustomHatsPage() {
  const products = await getTownieProducts().catch(() => []);
  const towns = customTowns(products);
  const shelf = products.slice(0, 4);

  // Towns grouped by region, for the "serving businesses across Massachusetts" list.
  const byRegion = new Map<string, typeof towns>();
  for (const t of towns) byRegion.set(t.region, [...(byRegion.get(t.region) ?? []), t]);

  const url = `${SITE_URL}${CUSTOM_HUB}`;
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${url}#service`,
      name: 'Custom embroidered hats',
      serviceType: 'Custom hat embroidery',
      description: DESCRIPTION,
      url,
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: { '@type': 'State', name: 'Massachusetts' },
      audience: { '@type': 'BusinessAudience', name: 'Businesses, teams, schools and fundraisers' },
    },
    faqSchema(FAQS),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Custom Hats', path: CUSTOM_HUB },
    ]),
  ];

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />

      <CustomHero
        eyebrow="Custom hats · Massachusetts"
        title="Your logo, embroidered on a Townies hat."
        lead={
          <>
            For businesses, teams, schools, fundraisers and local events. {CUSTOM_MIN} to {CUSTOM_MAX} hats, priced
            within {CUSTOM_QUOTE_WINDOW}.
          </>
        }
        image={{ src: '/brand/scene/bulk-order.jpg', alt: 'A pile of Braintree Townies snapbacks fresh from the embroiderer' }}
      />

      <Section>
        <SectionHead label="Who it is for" title="Anyone with a logo and a crowd." />
        <CardGrid
          cols={4}
          items={[
            { kicker: 'Businesses', title: 'Staff and customers.', body: 'Hats for the counter, the job site, the front desk, or the regulars who keep asking.' },
            { kicker: 'Teams', title: 'Leagues and clubs.', body: 'Youth teams, rec leagues and men’s league, with the team on the front and the town on the side.' },
            { kicker: 'Schools', title: 'Boosters and classes.', body: 'Booster clubs, PTOs, class gifts and reunions.' },
            { kicker: 'Fundraisers and events', title: 'Anything with a sign-up sheet.', body: 'Road races, town days, golf tournaments and the raffle table.' },
          ]}
        />
      </Section>

      <HowItWorks />

      <WhatGoesOn />

      <Section ground>
        <SectionHead label="The hats" title="Weld, Richardson, Yupoong." sub="The makers we embroider on, in the colourways they actually sell." />
        <TheBlanks />
      </Section>

      {shelf.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-8 sm:py-16">
            <ShelfHeader
              title="Our own work"
              sub="Town hats we make and sell ourselves. Same embroidery, same hats."
              link={{ href: '/shop', label: 'Shop all' }}
            />
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
              {shelf.map((p) => (
                <HatCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CampaignBand
        src="/brand/scene/milton-21x9.jpg"
        mobileSrc="/brand/drops/milton.jpg"
        alt="Two Milton Townies snapbacks on a curb in Milton Village"
        eyebrow="Proof of stitch"
        title="Made like Milton."
        sub="Every Townies hat is embroidered. Yours would be too."
        cta={{ href: CUSTOM_BUILDER, label: 'Build your hat' }}
        align="left"
      />

      <Section>
        <SectionHead label="Questions" title="The short answers." />
        <FaqList faqs={FAQS} />
      </Section>

      <Section ground>
        <SectionHead
          label="Local"
          title="Serving businesses across Massachusetts."
          sub="We make hats for these towns already. Ordering for a business, team or school in one of them? Start with your town."
        />
        {[...byRegion.entries()].map(([region, list]) => (
          <CustomTownLinks key={region} heading={regionLabel(region)} towns={list} />
        ))}
        <p className="mt-8 text-[0.9375rem] text-muted">
          Somewhere else in Massachusetts? Same hats, same process.{' '}
          <Link href="/custom-hats/build" className="text-text underline underline-offset-4">
            Start a mockup
          </Link>
          .
        </p>
      </Section>

      <div className="pt-12 sm:pt-16" />
      <CustomClose title="Start with a mockup." sub={`See your logo on the hat, then send it over. ${CUSTOM_MIN} to ${CUSTOM_MAX} hats, priced within ${CUSTOM_QUOTE_WINDOW}.`} />
    </div>
  );
}
