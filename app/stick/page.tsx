import type { Metadata } from 'next';
import { StickComingSoon } from '@/components/stick/coming-soon';

export const metadata: Metadata = {
  title: { absolute: 'Stick · Golf by Townies' },
  description: 'Stick is a golfwear and accessories line from Townies. Headcovers, hats and more, coming soon.',
  openGraph: {
    siteName: 'Stick',
    title: 'Stick · Golf by Townies',
    description: 'Golfwear and accessories from Townies. Coming soon.',
  },
};

export default function StickPage() {
  return <StickComingSoon />;
}
