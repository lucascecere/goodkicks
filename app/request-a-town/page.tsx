import type { Metadata } from 'next';
import Link from 'next/link';
import { PageMasthead } from '@/components/townies/page-masthead';
import { TownRequestForm } from '@/components/forms/town-request-form';

export const metadata: Metadata = {
  title: 'Request a Town — Townies',
  description: 'Do not see your town? Tell us. Every request is counted, and the towns that shout loudest get made first.',
  alternates: { canonical: '/request-a-town' },
  openGraph: {
    title: 'Request a Town — Townies',
    description: 'Do not see your town? Tell us. Every request is counted, and the towns that shout loudest get made first.',
    url: '/request-a-town',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
};

export default function Page() {
  return (
    <div className="bg-town-cream">
      <PageMasthead
        eyebrow="Not on the list yet"
        title="Request your town."
        sub={`We’re working out from the South Shore one town at a time. Every request gets counted — the loudest towns get made first.`}
        pattern="ma"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <TownRequestForm />

        <div className="mt-14 pt-8 border-t border-town-rule text-sm text-town-muted">
          Already have a shop and want to stock us? Head to <Link href="/wholesale" className="underline underline-offset-4 hover:text-town-navy">wholesale</Link>. Anything else, <Link href="/support" className="underline underline-offset-4 hover:text-town-navy">support</Link> is here.
        </div>
      </div>
    </div>
  );
}
