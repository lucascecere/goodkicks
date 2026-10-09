'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { dollars, minPriceCents, WHOLESALE_LABEL, type WholesaleType } from '@/lib/shop/money';

type Hat = {
  id: string;
  title: string;
  image: string | null;
  type: WholesaleType;
  wholesale: number;
  price: number | null;
  selling: boolean;
};

type SellerInfo = {
  name: string;
  status: string;
  blurb: string;
  town: string;
  website: string;
  instagram: string;
  contact_phone: string;
  pickup_enabled: boolean;
  pickup_address: string;
  pickup_notes: string;
  joined: boolean;
  hasStripe: boolean;
};

const input =
  'w-full border border-rule bg-white px-3 py-2.5 text-[0.9375rem] text-text placeholder:text-stone focus:border-text focus:outline-none';
const label = 'mb-1.5 block font-label text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-muted';

function Step({ n, title, children, done }: { n: number; title: string; children: React.ReactNode; done?: boolean }) {
  return (
    <section className="border-t border-rule pt-8">
      <div className="mb-5 flex items-center gap-3">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full font-label text-xs font-bold ${done ? 'bg-band text-white' : 'bg-text text-white'}`}>
          {done ? '✓' : n}
        </span>
        <h2 className="display text-[1.5rem] text-text">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function JoinForm({
  token,
  seller,
  hats: initialHats,
  payoutsReady,
  payoutsOpen,
}: {
  token: string;
  seller: SellerInfo;
  hats: Hat[];
  payoutsReady: boolean;
  payoutsOpen: boolean;
}) {
  const [info, setInfo] = useState(seller);
  const [hats, setHats] = useState(
    initialHats.map((h) => ({ ...h, priceText: h.price ? (h.price / 100).toFixed(2) : '' })),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(seller.joined);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof SellerInfo>(k: K, v: SellerInfo[K]) => {
    setInfo((s) => ({ ...s, [k]: v }));
    setSaved(false);
  };
  const setHat = (id: string, patch: Partial<(typeof hats)[number]>) => {
    setHats((hs) => hs.map((h) => (h.id === id ? { ...h, ...patch } : h)));
    setSaved(false);
  };
  const cents = (t: string) => {
    const n = Math.round(parseFloat(t.replace(/[^0-9.]/g, '')) * 100);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const selling = hats.filter((h) => h.selling);
  const pricesOk = selling.every((h) => {
    const c = cents(h.priceText);
    return c !== null && c >= minPriceCents(h.wholesale);
  });

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/shop/join/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...info,
          hats: hats.map((h) => ({ id: h.id, sell: h.selling, price_cents: cents(h.priceText) })),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not save. Try again.');
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10">
      <Step n={1} title="Your info">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="blurb">A line or two about your business</label>
            <textarea id="blurb" rows={3} className={input} value={info.blurb} maxLength={400} onChange={(e) => set('blurb', e.target.value)} placeholder="What you do, and how long you've been doing it in town." />
          </div>
          <div>
            <label className={label} htmlFor="town">Town</label>
            <input id="town" className={input} value={info.town} onChange={(e) => set('town', e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="phone">Phone</label>
            <input id="phone" className={input} value={info.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="web">Website</label>
            <input id="web" className={input} value={info.website} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
          </div>
          <div>
            <label className={label} htmlFor="ig">Instagram</label>
            <input id="ig" className={input} value={info.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@yourshop" />
          </div>
        </div>

        <div className="mt-6 border border-rule p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" className="mt-1" checked={info.pickup_enabled} onChange={(e) => set('pickup_enabled', e.target.checked)} />
            <span>
              <span className="block font-semibold text-text">Offer free pickup at your place</span>
              <span className="text-sm text-muted">We drop the hat off and email the buyer. They just give you their name.</span>
            </span>
          </label>
          {info.pickup_enabled && (
            <div className="mt-4 grid gap-4">
              <div>
                <label className={label} htmlFor="paddr">Pickup address</label>
                <input id="paddr" className={input} value={info.pickup_address} onChange={(e) => set('pickup_address', e.target.value)} placeholder="12 Main St, Milton" />
              </div>
              <div>
                <label className={label} htmlFor="pnotes">Pickup notes (optional)</label>
                <input id="pnotes" className={input} value={info.pickup_notes} onChange={(e) => set('pickup_notes', e.target.value)} placeholder="Open Tue to Sat, 9 to 5. Ask at the counter." />
              </div>
            </div>
          )}
        </div>
      </Step>

      <Step n={2} title="Your hats and prices">
        {hats.length === 0 ? (
          <p className="border border-dashed border-rule px-4 py-8 text-center text-muted">We&rsquo;re still adding your designs. Check back soon.</p>
        ) : (
          <>
            <p className="mb-5 text-sm leading-relaxed text-muted">
              You set the price. We keep {dollars(2200)} on an everyday hat and {dollars(2400)} on a lifestyle hat, which covers making,
              stitching and stocking it. You keep everything above that.
            </p>
            <ul className="space-y-3">
              {hats.map((h) => {
                const c = cents(h.priceText);
                const min = minPriceCents(h.wholesale);
                const low = h.selling && (c === null || c < min);
                return (
                  <li key={h.id} className={`flex flex-col gap-4 border p-4 sm:flex-row sm:items-center ${h.selling ? 'border-text' : 'border-rule'}`}>
                    <label className="flex flex-1 cursor-pointer items-center gap-4">
                      <input type="checkbox" checked={h.selling} onChange={(e) => setHat(h.id, { selling: e.target.checked })} />
                      <div className="relative h-16 w-16 shrink-0 bg-[#F1EEE8]">
                        {h.image && <Image src={h.image} alt="" fill sizes="64px" className="object-contain p-1 mix-blend-multiply" />}
                      </div>
                      <span className="min-w-0">
                        <span className="block font-semibold text-text">{h.title}</span>
                        <span className="text-sm text-muted">{WHOLESALE_LABEL[h.type]} · we keep {dollars(h.wholesale)}</span>
                      </span>
                    </label>
                    {h.selling && (
                      <div className="sm:w-44">
                        <div className="flex items-center border border-rule bg-white focus-within:border-text">
                          <span className="pl-3 text-muted">$</span>
                          <input
                            inputMode="decimal"
                            aria-label={`Price for ${h.title}`}
                            className="w-full bg-transparent px-2 py-2.5 text-[0.9375rem] text-text focus:outline-none"
                            value={h.priceText}
                            placeholder={(min / 100 + 9).toFixed(2)}
                            onChange={(e) => setHat(h.id, { priceText: e.target.value })}
                          />
                        </div>
                        <p className={`mt-1 text-xs ${low ? 'text-red-700' : 'text-band'}`}>
                          {c === null ? `At least ${dollars(min)}` : c < min ? `At least ${dollars(min)}` : `You earn ${dollars(c - h.wholesale)} a hat`}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {error && <p className="mt-5 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={save}
            disabled={saving || !pricesOk || (info.pickup_enabled && !info.pickup_address.trim())}
            className="bg-accent px-6 py-3.5 font-label text-xs font-bold uppercase tracking-[0.16em] text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save my shop'}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-band">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </Step>

      <Step n={3} title="Get paid" done={payoutsReady}>
        {payoutsReady ? (
          <p className="text-muted">
            You&rsquo;re connected. Your share of every hat is sent to your bank 14 days after the order ships or is picked up.
          </p>
        ) : !payoutsOpen ? (
          <p className="text-muted">Payouts open soon. We&rsquo;ll email you when you can connect your bank.</p>
        ) : (
          <>
            <p className="mb-5 text-muted">
              Payouts go through Stripe. You&rsquo;ll confirm a few details and add the bank account where you want your share sent.
              It takes about three minutes.
            </p>
            <a
              href={`/api/shop/connect/${token}`}
              className="inline-block bg-accent px-6 py-3.5 font-label text-xs font-bold uppercase tracking-[0.16em] text-accent-contrast"
            >
              {seller.hasStripe ? 'Finish connecting payouts' : 'Connect payouts'}
            </a>
          </>
        )}
      </Step>

      {saved && payoutsReady && seller.status !== 'live' && (
        <p className="border border-band/40 bg-band/5 px-5 py-4 text-text">
          All set. We&rsquo;ll give your shop a last look and open it, usually the same day.
        </p>
      )}
    </div>
  );
}
