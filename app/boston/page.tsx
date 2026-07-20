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
      blurb="Boston's coming — don't rush us. We started on the South Shore and we're working our way up the map, town by town, doing each one right. Get on the list and you'll know the second Boston drops. Or tell us which town to do first."
    />
  );
}
