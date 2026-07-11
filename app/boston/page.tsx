import type { Metadata } from 'next';
import { ComingSoonRegion } from '@/components/townies/coming-soon-region';

export const metadata: Metadata = {
  title: 'Boston — Coming Soon',
  description:
    'Townies is bringing Massachusetts town-pride apparel to Greater Boston. The South Shore drops first — join the town list to know the moment Boston lands.',
  alternates: { canonical: '/boston' },
};

export default function BostonPage() {
  return (
    <ComingSoonRegion
      region="Boston"
      blurb="Greater Boston is on the board. We're starting with the South Shore and working up the map from there. Join the town list and we'll tell you the moment Boston drops — and request your town while you're at it."
    />
  );
}
