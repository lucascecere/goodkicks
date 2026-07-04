import type { Metadata } from 'next';
import { GoodKicksHeader } from '@/components/goodkicks/header';
import { GoodKicksFooter } from '@/components/goodkicks/footer';

// Good Kicks metadata scope — overrides the root Townies title template + OG
// for everything under /goodkicks. (data-brand is set on the SiteWrapper root
// by pathname, so the semantic tokens here resolve to the Good Kicks palette.)
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
    description: 'Premium foot bags built for dorm circles and campus quads. Six colorways.',
  },
};

export default function GoodKicksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bg text-text min-h-screen font-body">
      <GoodKicksHeader />
      {children}
      <GoodKicksFooter />
    </div>
  );
}
