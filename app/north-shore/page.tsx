import type { Metadata } from 'next';
import { ComingSoonRegion } from '@/components/townies/coming-soon-region';

export const metadata: Metadata = {
  title: 'North Shore — Coming Soon',
  description:
    'Townies is bringing Massachusetts town-pride apparel to the North Shore. The South Shore drops first — join the town list to know the moment the North Shore lands.',
  alternates: { canonical: '/north-shore' },
};

export default function NorthShorePage() {
  return (
    <ComingSoonRegion
      region="North Shore"
      blurb="The North Shore is on the board. We're starting with the South Shore and working up the map from there. Join the town list and we'll tell you the moment the North Shore drops — and request your town while you're at it."
    />
  );
}
