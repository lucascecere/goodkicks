import type { Metadata } from 'next';
import Link from 'next/link';
import { PageMasthead } from '@/components/townies/page-masthead';
import { WholesaleForm } from '@/components/forms/wholesale-form';

// URL stays /wholesale — it has the inbound links and the search history — but
// everything a person actually reads now leads with bulk. /bulk-orders is
// redirected here in middleware.ts for anyone who guesses the obvious address.
const TITLE = 'Bulk orders & wholesale — Townies';
const DESCRIPTION =
  'Hats for teams, companies, schools, fundraisers and shops. Tell us how many and which towns, and the first reply comes back with a real price and a lead time.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/wholesale' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/wholesale',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
};

export default function Page() {
  return (
    <div className="bg-town-cream">
      <PageMasthead
        eyebrow="Bulk orders & wholesale"
        title="Kit out the whole town."
        sub={`Teams, companies, schools, fundraisers and shops. There's no bulk checkout — tell us how many and which hats, and we come back with a real price and a lead time, then run the order over email.`}
        pattern="pine"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <WholesaleForm />

        <div className="mt-14 pt-8 border-t border-town-rule text-sm text-town-muted">
          {/* This used to open "Not a shop? You might want the ambassador
              program instead" — which read as a dismissal to the coach ordering
              thirty team hats, i.e. exactly the person the page is for. Only
              genuinely different jobs get pointed elsewhere now. */}
          Just after one hat? <Link href="/shop" className="underline underline-offset-4 hover:text-town-navy">Shop the towns</Link>. Want a town we don&rsquo;t make yet? <Link href="/request-a-town" className="underline underline-offset-4 hover:text-town-navy">Request it here</Link>. Want to rep Townies for a cut? <Link href="/ambassadors" className="underline underline-offset-4 hover:text-town-navy">The Town Rep program</Link>.
        </div>
      </div>
    </div>
  );
}
