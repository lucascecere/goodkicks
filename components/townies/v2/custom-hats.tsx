import Link from 'next/link';
import { BLANKS, BLANK_BRANDS } from '@/lib/townies/blanks';
import Image from 'next/image';
import type { TownPage } from '@/lib/townies/towns';
import { CUSTOM_BUILDER, CUSTOM_MAX, CUSTOM_MIN, CUSTOM_QUOTE_WINDOW, customTownHref } from '@/lib/townies/custom-hats';

// Shared sections for /custom-hats and /custom-hats/<town>. Same v2 grammar as
// the storefront: white page, studio ground, navy type, square buttons.

export const BTN_SOLID =
  'font-label inline-flex w-fit items-center bg-text px-8 py-4 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-text/85';
export const BTN_OUTLINE =
  'font-label inline-flex w-fit items-center border border-text px-8 py-4 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-text transition-colors hover:bg-text hover:text-white';
export const LABEL = 'font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/60';

export function CustomCtas() {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link href={CUSTOM_BUILDER} className={BTN_SOLID}>
        Build your hat
      </Link>
      <Link href="/shop" className={BTN_OUTLINE}>
        See our stitching
      </Link>
    </div>
  );
}

/** Copy left on the studio ground, one photograph right. */
export function CustomHero({
  eyebrow,
  title,
  lead,
  image,
}: {
  eyebrow: string;
  title: string;
  lead: React.ReactNode;
  image: { src: string; alt: string };
}) {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-[1320px] gap-3 px-4 pt-4 pb-12 sm:px-8 sm:pb-16 lg:grid-cols-2 lg:gap-5">
        <div className="flex flex-col justify-center bg-[#F1EEE8] p-8 sm:p-12 lg:p-16">
          <p className={LABEL}>{eyebrow}</p>
          <h1 className="display mt-4 text-[2.5rem] text-text sm:text-[3.25rem]">{title}</h1>
          <div className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-muted">{lead}</div>
          <CustomCtas />
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-[#F1EEE8] lg:aspect-auto lg:min-h-[520px]">
          <Image src={image.src} alt={image.alt} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}

export function Section({ children, ground = false }: { children: React.ReactNode; ground?: boolean }) {
  return (
    <section className={ground ? 'bg-[#F1EEE8]' : 'bg-white'}>
      <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-8 sm:py-16">{children}</div>
    </section>
  );
}

export function SectionHead({ label, title, sub }: { label?: string; title: string; sub?: React.ReactNode }) {
  return (
    <div className="mb-8 max-w-2xl sm:mb-10">
      {label && <p className={LABEL}>{label}</p>}
      <h2 className="display mt-3 text-[2rem] text-text sm:text-[2.5rem]">{title}</h2>
      {sub && <p className="mt-3 text-[1rem] leading-relaxed text-muted">{sub}</p>}
    </div>
  );
}

/** A plain numbered or labelled grid of short cards. */
export function CardGrid({ items, cols = 3 }: { items: Array<{ kicker: string; title: string; body: React.ReactNode }>; cols?: 2 | 3 | 4 }) {
  const grid = cols === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';
  return (
    <div className={`grid gap-3 sm:gap-5 ${grid}`}>
      {items.map((it) => (
        <div key={it.title} className="border-t border-text pt-5">
          <p className={LABEL}>{it.kicker}</p>
          <h3 className="mt-2 font-label text-[1.125rem] font-bold text-text">{it.title}</h3>
          <div className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{it.body}</div>
        </div>
      ))}
    </div>
  );
}

export function HowItWorks() {
  return (
    <Section>
      <SectionHead label="How it works" title="Three steps, mostly email." />
      <CardGrid
        items={[
          {
            kicker: '01',
            title: 'Mock it up.',
            body: (
              <>
                Pick a Weld, Richardson or Yupoong blank and put your logo on it in the{' '}
                <Link href={CUSTOM_BUILDER} className="text-text underline underline-offset-4">
                  hat builder
                </Link>
                .
              </>
            ),
          },
          {
            kicker: '02',
            title: 'Send it over.',
            body: `Tell us how many (${CUSTOM_MIN} to ${CUSTOM_MAX}) and where they are going. You get a price within ${CUSTOM_QUOTE_WINDOW}.`,
          },
          {
            kicker: '03',
            title: 'We stitch it.',
            body: 'Once the price and the details are agreed, your logo is embroidered straight onto the hat.',
          },
        ]}
      />
    </Section>
  );
}

export function TheBlanks() {
  // From lib/townies/blanks.ts: the makers we embroider on, with real colourway counts.
  return (
    <CardGrid
      cols={3}
      items={BLANK_BRANDS.map((brand) => {
        const models = BLANKS.filter((m) => m.brand === brand);
        const colours = models.reduce((n, m) => n + m.colorways.length, 0);
        return {
          kicker: brand,
          title: `${models.length} blanks, ${colours} colorways.`,
          body: models.map((m) => `${m.model}`).join(' · ') + '. ' + (brand === 'Weld'
            ? 'The two-tone Workhorse is the blank on most of our own town hats.'
            : brand === 'Richardson'
              ? 'The 112 is the trucker everyone knows.'
              : 'Classic truckers and flat-bill snapbacks; the 6502 is our Everyday.'),
        };
      })}
    />
  );
}

/** Front, side and the proof: the photograph of our own hats. */
export function WhatGoesOn({ zip }: { zip?: string }) {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-[1320px] gap-3 px-4 py-12 sm:px-8 sm:py-16 lg:grid-cols-2 lg:gap-5">
        <div className="relative aspect-[16/10] overflow-hidden bg-[#F1EEE8]">
          <Image
            src="/brand/scene/clover-hero-16x10.jpg"
            alt="Milton, Walpole and West Roxbury Townies snapbacks in the clover, with a year and a zip patch stitched on the sides"
            fill
            sizes="(max-width:1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center lg:pl-10">
          <p className={LABEL}>What goes on a hat</p>
          <h2 className="display mt-3 text-[2rem] text-text sm:text-[2.5rem]">Front, side, done.</h2>
          <dl className="mt-6 space-y-5 text-[0.9375rem] leading-relaxed text-muted">
            <div>
              <dt className="font-label font-bold text-text">On the front</dt>
              <dd className="mt-1">Your logo or your name, embroidered directly onto the crown.</dd>
            </div>
            <div>
              <dt className="font-label font-bold text-text">On the side</dt>
              <dd className="mt-1">
                A zip code{zip ? `, like ${zip}` : ''}, a year, or a short line of text. The same way our own town hats carry
                theirs.
              </dd>
            </div>
          </dl>
          <p className="mt-6 text-[0.9375rem] text-muted">
            Want to see the stitching first?{' '}
            <Link href="/shop" className="text-text underline underline-offset-4">
              Every hat in the shop
            </Link>{' '}
            is embroidered the same way.
          </p>
        </div>
      </div>
    </section>
  );
}

export type Faq = { q: string; a: string };

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="max-w-3xl divide-y divide-rule border-y border-rule">
      {faqs.map((f) => (
        <details key={f.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-label text-[1.0625rem] font-bold text-text">
            {f.q}
            <span aria-hidden className="text-text/50 transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function faqSchema(faqs: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** Town pills linking to each town's custom-hats page. */
export function CustomTownLinks({ towns, heading }: { towns: TownPage[]; heading?: string }) {
  if (towns.length === 0) return null;
  return (
    <div className="mt-8 first:mt-0">
      {heading && <h3 className="mb-3 font-label text-[1rem] font-bold text-text">{heading}</h3>}
      <ul className="flex flex-wrap gap-2">
        {towns.map((t) => (
          <li key={t.slug}>
            <Link
              href={customTownHref(t.slug)}
              className="inline-flex items-center border border-text/25 px-4 py-2 text-[0.875rem] font-semibold text-text transition-colors hover:border-text hover:bg-text hover:text-white"
            >
              Custom hats in {t.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Closing band: navy, one line, the two buttons. */
export function CustomClose({ title, sub }: { title: string; sub: string }) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1320px] px-4 pb-16 sm:px-8 sm:pb-20">
        <div className="bg-text p-8 text-white sm:p-12 lg:p-16">
          <h2 className="display text-[2.25rem] sm:text-[3rem]">{title}</h2>
          <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-white/75">{sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={CUSTOM_BUILDER}
              className="font-label inline-flex w-fit items-center bg-white px-8 py-4 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-text transition-colors hover:bg-[#F1EEE8]"
            >
              Build your hat
            </Link>
            <Link
              href="/shop"
              className="font-label inline-flex w-fit items-center border border-white/60 px-8 py-4 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white hover:text-text"
            >
              See our stitching
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
