import type { Metadata } from 'next';
import Link from 'next/link';
import { PageMasthead } from '@/components/townies/page-masthead';
import { WholesaleForm } from '@/components/forms/wholesale-form';

// Wholesale = OUR town hats bought in volume at a wholesale price (shops,
// events, fundraisers). Their own logo on a hat is /custom-hats (Lucas, 10-07).
const TITLE = 'Wholesale Townies Hats for Shops, Events and Fundraisers';
const DESCRIPTION =
  'Stock Townies town hats in your shop, or buy them in volume for an event or fundraiser. Wholesale pricing and a lead time by email.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/wholesale' },
  openGraph: {
    title: `${TITLE} | Townies`,
    description: DESCRIPTION,
    url: '/wholesale',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 630 }],
  },
};

const SHOP_POINTS = [
  {
    title: 'Your town’s hat',
    body: 'Stock five or more of your town’s Townies hat at a wholesale price, so there’s real margin on every one you sell.',
  },
  {
    title: 'Your own merch',
    body: 'Want your shop’s logo on the same hat? We make that too, see custom hats below.',
  },
  {
    title: 'Made for your order',
    body: 'We embroider every wholesale order fresh. It’s usually a few weeks from your yes, and we give you a date when we quote.',
  },
];

export default function Page() {
  return (
    <div className="bg-bg">
      <PageMasthead
        eyebrow="Wholesale"
        title="Our town hats, by the box."
        sub="For local shops that want their town's hat on the counter, and for teams, events and fundraisers buying in volume. Tell us which towns and how many, and we reply with wholesale pricing and a date."
        pattern="pine"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        {/* 2026-10-30: shops are the main audience now (Lucas is pitching one
            counter per town). Two offers, and orders are made to order. */}
        <div className="mb-14 grid gap-8 sm:grid-cols-3">
          {SHOP_POINTS.map((p) => (
            <div key={p.title}>
              <h2 className="display text-xl text-text">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </div>
        <WholesaleForm />

        <div className="mt-14 pt-8 border-t border-rule text-sm text-muted">
          {/* This used to open "Not a shop? You might want the ambassador
              program instead" — which read as a dismissal to the coach ordering
              thirty team hats, i.e. exactly the person the page is for. Only
              genuinely different jobs get pointed elsewhere now. */}
          Want your own logo on the hat instead? That's <Link href="/custom-hats" className="underline underline-offset-4 hover:text-text">custom hats</Link>, with a mockup builder. Just after one hat? <Link href="/shop" className="underline underline-offset-4 hover:text-text">Shop the towns</Link>. Want a town we don&rsquo;t make yet? <Link href="/request-a-town" className="underline underline-offset-4 hover:text-text">Request it here</Link>.
        </div>
      </div>
    </div>
  );
}
