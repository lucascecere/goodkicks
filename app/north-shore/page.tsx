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
      blurb="North Shore, we didn't forget you. We started on the South Shore and we're working our way up the map, town by town, doing each one right. Get on the list and you'll know the second it drops. Or tell us which town to do first."
    />
  );
}
