import type { Metadata } from 'next';

// Good Kicks metadata scope — overrides the root Townies title template + OG
// for everything under /goodkicks. The chrome (parent strip, header, footer,
// cart) is the shared set in SiteWrapper, which reads the brand from the path
// and host and sets data-brand so the semantic tokens resolve to Good Kicks.
export const metadata: Metadata = {
  title: {
    template: '%s | Good Kicks',
    default: 'Good Kicks — Premium Foot Bags for Your Circle',
  },
  description:
    'Premium foot bags — what everyone calls hacky sacks — built for dorm circles, campus quads, and every backpack that needs one.',
  openGraph: {
    siteName: 'Good Kicks',
    type: 'website',
    title: 'Good Kicks — Premium Foot Bags for Your Circle',
    description: 'Premium foot bags built for dorm circles and campus quads. Pick your colorway.',
  },
};

export default function GoodKicksLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-bg text-text min-h-screen font-body">{children}</div>;
}
