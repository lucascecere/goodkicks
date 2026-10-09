import type { Metadata } from 'next';
import { PageMasthead } from '@/components/townies/page-masthead';
import { ApplyForm } from '@/components/market/apply-form';
import { MARKET_BASE } from '@/lib/shop/paths';

const TITLE = 'Get a Stall at the Townies Local Market';
const DESCRIPTION =
  'Sell custom hats for your Massachusetts business on Townies. We design, stitch, stock and ship them. You set the price and get your share of every sale.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${MARKET_BASE}/apply` },
};

export default function ApplyPage() {
  return (
    <>
      <PageMasthead
        eyebrow="The Local Market"
        title="Get a stall."
        sub="Your logo on our hats, sold from your own stall on Townies. We design and stitch them, keep them in stock, ship every order and handle returns. You set the price and keep everything above our cost."
        pattern="pine"
      />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_360px]">
        <ApplyForm />
        <aside className="space-y-6 text-sm leading-relaxed text-muted">
          <div>
            <p className="mb-2 font-label text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-text">How it works</p>
            <ol className="list-decimal space-y-2 pl-4">
              <li>Tell us about your business. We reply within a few days.</li>
              <li>We design your hats with you and stitch a small first run.</li>
              <li>You set your prices and connect where you want to get paid.</li>
              <li>Your stall opens. We ship every order, or drop it at your door for pickup.</li>
            </ol>
          </div>
          <div>
            <p className="mb-2 font-label text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-text">What it costs you</p>
            <p>Nothing up front and no minimums. We keep a set amount per hat to cover making it; everything above that is yours, paid out after each order ships.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
