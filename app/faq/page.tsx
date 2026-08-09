import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandPattern } from '@/components/townies/brand-pattern';

export const metadata: Metadata = {
  title: 'FAQ — Townies',
  description:
    'Everything you need to know about Townies hats — fit, pre-orders, materials, shipping, returns, and requesting your town.',
  alternates: { canonical: '/faq' },
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'How do the hats fit?',
    a: (
      <>
        One size fits most. Every hat is an adjustable snapback with a plastic closure, so it
        dials in from about 55–60cm. If a snapback has ever fit you, this will too. More detail on
        the{' '}
        <Link href="/size-guide" className="underline underline-offset-2 hover:text-town-forest">
          size guide
        </Link>
        .
      </>
    ),
  },
  {
    q: 'What does “pre-order” mean, and when will it ship?',
    a: (
      <>
        A pre-order hat is one we&apos;re making in the next run. Order it now to lock yours in;
        it ships in about <strong>3–4 weeks</strong>. If your order has any pre-order item in it,
        the whole order ships together once the pre-order&apos;s ready. In-stock hats ship in a few
        days.
      </>
    ),
  },
  {
    q: 'What are the hats made of?',
    a: (
      <>
        Our two-tone Classics run a soft brushed 100% cotton-twill workhorse blank — slightly
        structured, pre-curved brim, broken-in from day one. The solid-color ZIP hats use a
        low-profile unstructured polyester blank. Both are adjustable snapbacks, and all the
        lettering is raised embroidery — stitched, not printed.
      </>
    ),
  },
  {
    q: 'Where do you ship, and how much is it?',
    a: (
      <>
        We ship across the U.S. Rates and timing are on the{' '}
        <Link
          href="/shipping-returns"
          className="underline underline-offset-2 hover:text-town-forest"
        >
          shipping &amp; returns
        </Link>{' '}
        page. Pre-orders ship in ~3–4 weeks; in-stock orders go out within a few days.
      </>
    ),
  },
  {
    q: 'Can I return or exchange a hat?',
    a: (
      <>
        Yeah — see the{' '}
        <Link
          href="/shipping-returns"
          className="underline underline-offset-2 hover:text-town-forest"
        >
          shipping &amp; returns
        </Link>{' '}
        page for the window and how to start one. Pre-orders are made to order, so heads up on
        those.
      </>
    ),
  },
  {
    q: 'You don’t have my town. What gives?',
    a: (
      <>
        We&apos;re working our way across the map one town at a time — South Shore first, then
        Boston&apos;s neighborhoods and Southeastern Mass, and outward from there. Tell us which
        town to do next on the{' '}
        <Link href="/support" className="underline underline-offset-2 hover:text-town-forest">
          request-a-town form
        </Link>{' '}
        or get on the{' '}
        <Link href="/#join" className="underline underline-offset-2 hover:text-town-forest">
          town list
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Do you do wholesale or custom town orders?',
    a: (
      <>
        We do — teams, shops, reunions, whatever. Hit us through the wholesale option on the{' '}
        <Link href="/support" className="underline underline-offset-2 hover:text-town-forest">
          contact page
        </Link>{' '}
        and we&apos;ll figure it out.
      </>
    ),
  },
  {
    q: 'Are you the same people as Good Kicks?',
    a: (
      <>
        Same crew. Good Kicks — the hand-stitched foot bags — came first and taught us how to make
        something people actually keep. Townies grew out of it. Both are still going.
      </>
    ),
  },
];

export default function FAQPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          typeof f.a === 'string'
            ? f.a
            : f.q, // structured answers render as HTML on-page; schema keeps the question text.
      },
    })),
  };

  return (
    <div className="relative overflow-hidden bg-town-cream min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <BrandPattern variant="ma" color="forest" opacity={0.05} size={220} fade="b" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium mb-3">
          Questions
        </p>
        <h1 className="font-block uppercase text-4xl sm:text-6xl text-town-navy leading-[0.95] mb-4">
          FAQ.
        </h1>
        <p className="text-town-muted max-w-xl mb-14 leading-relaxed">
          The stuff people ask most. Still stuck?{' '}
          <Link href="/support" className="underline underline-offset-2 hover:text-town-forest">
            Holler at us
          </Link>
          .
        </p>
        <div className="divide-y divide-town-rule border-t border-town-rule">
          {FAQS.map((f) => (
            <div key={f.q} className="py-7">
              <h2 className="font-block uppercase text-lg sm:text-xl text-town-navy mb-2 leading-snug">
                {f.q}
              </h2>
              <p className="text-town-muted leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
