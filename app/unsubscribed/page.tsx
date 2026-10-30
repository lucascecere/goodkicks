import type { Metadata } from 'next';
import Link from 'next/link';
import { PageMasthead } from '@/components/townies/page-masthead';

export const metadata: Metadata = {
  title: 'Unsubscribed',
  robots: { index: false, follow: false },
};

export default async function UnsubscribedPage({ searchParams }: { searchParams: Promise<{ bad?: string }> }) {
  const { bad } = await searchParams;
  return (
    <>
      <PageMasthead
        eyebrow="Email"
        title={bad ? 'That link didn’t work' : 'You’re unsubscribed'}
        sub={
          bad
            ? 'Reply to any of our emails with "unsubscribe" and we’ll take you off by hand.'
            : 'You won’t get any more drop emails from us. Order emails still come through.'
        }
        pattern="speckle"
      />
      <section className="bg-bg py-12 text-center">
        <Link href="/shop" className="text-sm underline underline-offset-2 text-muted hover:text-text">
          Back to the hats
        </Link>
      </section>
    </>
  );
}
