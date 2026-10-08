import type { Metadata } from 'next';
import { ComingSoonRegion } from '@/components/townies/coming-soon-region';

export const metadata: Metadata = {
  title: 'North Shore Town Hats: Coming Soon',
  description:
    'Townies is working its way up to the North Shore. Request your town and get on the list for the first North Shore hats.',
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
