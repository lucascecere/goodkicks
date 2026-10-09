import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSellerByToken, listProducts } from '@/lib/shop/db';
import { refreshPayoutStatus } from '@/lib/shop/connect';
import { shopStripeConfigured } from '@/lib/shop/config';
import { JoinForm } from '@/components/market/join-form';
import { Awning, awningTone } from '@/components/market/awning';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Set up your stall', robots: { index: false, follow: false } };

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ connected?: string }>;
}) {
  const { token } = await params;
  const { connected } = await searchParams;
  let seller = await getSellerByToken(token);
  if (!seller || seller.status === 'rejected') notFound();

  // Back from Stripe: ask Stripe directly rather than wait for the webhook.
  let payoutsReady = seller.payouts_enabled;
  if (connected && shopStripeConfigured() && seller.stripe_account_id) {
    try {
      payoutsReady = await refreshPayoutStatus(seller);
      seller = { ...seller, payouts_enabled: payoutsReady };
    } catch (err) {
      console.error('[shop] payout status refresh failed', err);
    }
  }

  const hats = (await listProducts(seller.id)).filter((p) => p.status !== 'archived');

  return (
    <>
      <section className="border-b border-rule bg-masthead">
        <Awning tone={awningTone(seller.slug)} height={22} />
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-6 sm:px-8">
          <p className="mb-3 font-label text-[0.625rem] font-bold uppercase tracking-[0.22em] text-masthead-contrast/70">The Local Market</p>
          <h1 className="display text-[2.25rem] leading-none text-masthead-contrast sm:text-[3rem]">Set up {seller.name}&rsquo;s stall</h1>
          <p className="mt-4 max-w-xl leading-relaxed text-masthead-contrast/80">
            Three steps: check your info, pick your hats and set your prices, then connect where you want to get paid. We hold the
            stock, ship every order and handle returns.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-14">
        <JoinForm
          token={token}
          seller={{
            name: seller.name,
            status: seller.status,
            blurb: seller.blurb ?? '',
            town: seller.town ?? '',
            website: seller.website ?? '',
            instagram: seller.instagram ?? '',
            contact_phone: seller.contact_phone ?? '',
            pickup_enabled: seller.pickup_enabled,
            pickup_address: seller.pickup_address ?? '',
            pickup_notes: seller.pickup_notes ?? '',
            joined: Boolean(seller.joined_at),
            hasStripe: Boolean(seller.stripe_account_id),
          }}
          payoutsReady={payoutsReady}
          payoutsOpen={shopStripeConfigured()}
          hats={hats.map((h) => ({
            id: h.id,
            title: h.title,
            image: h.image_url,
            type: h.wholesale_type,
            wholesale: h.wholesale_cents,
            price: h.price_cents,
            selling: h.status === 'active',
          }))}
        />
      </div>
    </>
  );
}
