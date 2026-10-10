import 'server-only';
import type { ShippingAddress } from './types';
import { shopIsTestMode } from './config';

// Shipping labels through Shippo's REST API (no SDK: two calls is all we use).
//
// Flow: create a shipment (from → to, one parcel) → Shippo returns carrier
// rates → buy the cheapest USPS rate → get back a label PDF and tracking.
// Hats ship in a 4×6×6 box; weight grows with the hat count.

const API = 'https://api.goshippo.com';

export function shippoConfigured(): boolean {
  return Boolean(process.env.SHIPPO_API_KEY);
}

/**
 * Real labels cost real money, so a live Shippo key may only buy one on the
 * production site taking live payments. A preview, or a test-mode Stripe
 * order, refuses. The reverse is refused too: a test label on a real order
 * can't be shipped. Returns the reason, or null when buying is allowed.
 */
export function labelGuard(): string | null {
  const key = process.env.SHIPPO_API_KEY ?? '';
  const shippoLive = Boolean(key) && !key.startsWith('shippo_test_');
  const prod = process.env.VERCEL_ENV === 'production';
  const paymentsLive = !shopIsTestMode();
  if (shippoLive && (!prod || !paymentsLive)) {
    return 'Refusing to buy a real (paid) label here: this is a test site or a test-mode order. Use a shippo_test_ key outside production.';
  }
  if (!shippoLive && prod && paymentsLive) {
    return 'Shippo is on a test key, so this label could not be shipped. Set the live Shippo key in production.';
  }
  return null;
}

type ShippoAddress = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
};

function shipFrom(): ShippoAddress {
  const raw = process.env.SHOP_SHIP_FROM;
  if (!raw) throw new Error('SHOP_SHIP_FROM is not set (JSON: name, street1, city, state, zip).');
  const a = JSON.parse(raw) as Partial<ShippoAddress>;
  if (!a.name || !a.street1 || !a.city || !a.state || !a.zip) {
    throw new Error('SHOP_SHIP_FROM is missing name, street1, city, state or zip.');
  }
  return { country: 'US', ...a } as ShippoAddress;
}

/** One hat in its box is about 7 oz; each extra hat adds about 4 oz. */
export function parcelFor(hatCount: number) {
  const ounces = 7 + Math.max(0, hatCount - 1) * 4;
  // Bigger orders go in a bigger box.
  const box = hatCount <= 2 ? { length: '6', width: '6', height: '4' } : { length: '10', width: '8', height: '6' };
  return { ...box, distance_unit: 'in', weight: String(ounces), mass_unit: 'oz' };
}

async function shippo<T>(path: string, body: unknown): Promise<T> {
  const key = process.env.SHIPPO_API_KEY;
  if (!key) throw new Error('SHIPPO_API_KEY is not set.');
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: `ShippoToken ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => null)) as T | null;
  if (!res.ok || !json) {
    throw new Error(`Shippo ${path} failed (${res.status}): ${JSON.stringify(json)?.slice(0, 300)}`);
  }
  return json;
}

type Rate = {
  object_id: string;
  amount: string;
  provider: string;
  servicelevel: { name: string; token: string };
  estimated_days: number | null;
};

export type Label = {
  transactionId: string;
  labelUrl: string;
  trackingNumber: string;
  trackingUrl: string | null;
  carrier: string;
  service: string;
  costCents: number;
};

/** Buy the cheapest USPS label for an order. */
export async function buyLabel({
  to,
  email,
  phone,
  hatCount,
  orderNumber,
}: {
  to: ShippingAddress;
  email?: string | null;
  phone?: string | null;
  hatCount: number;
  orderNumber: number;
}): Promise<Label> {
  const blocked = labelGuard();
  if (blocked) throw new Error(blocked);
  if (!to.line1 || !to.city || !to.state || !to.postal_code) {
    throw new Error('This order has no complete shipping address.');
  }
  const shipment = await shippo<{ rates: Rate[]; messages?: { text: string }[] }>('/shipments/', {
    address_from: shipFrom(),
    address_to: {
      name: to.name || 'Customer',
      street1: to.line1,
      street2: to.line2 || undefined,
      city: to.city,
      state: to.state,
      zip: to.postal_code,
      country: to.country || 'US',
      email: email || undefined,
      phone: phone || undefined,
    },
    parcels: [parcelFor(hatCount)],
    metadata: `Townies order L${orderNumber}`,
    async: false,
  });

  const usps = shipment.rates.filter((r) => r.provider.toUpperCase() === 'USPS');
  const pool = usps.length ? usps : shipment.rates;
  if (!pool.length) {
    throw new Error(`No shipping rates came back. ${shipment.messages?.map((m) => m.text).join(' ') ?? ''}`.trim());
  }
  const rate = [...pool].sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))[0];

  const tx = await shippo<{
    object_id: string;
    status: string;
    label_url: string;
    tracking_number: string;
    tracking_url_provider: string | null;
    messages?: { text: string }[];
  }>('/transactions/', { rate: rate.object_id, label_file_type: 'PDF_4x6', async: false });

  if (tx.status !== 'SUCCESS') {
    throw new Error(`Label purchase failed: ${tx.messages?.map((m) => m.text).join(' ') || tx.status}`);
  }

  return {
    transactionId: tx.object_id,
    labelUrl: tx.label_url,
    trackingNumber: tx.tracking_number,
    trackingUrl: tx.tracking_url_provider,
    carrier: rate.provider,
    service: rate.servicelevel.name,
    costCents: Math.round(parseFloat(rate.amount) * 100),
  };
}

/**
 * Ask Shippo to watch a tracking number we didn't buy through Shippo (a hat
 * shipped by hand), so the "delivered" webhook still fires for it.
 */
export async function registerTracking(carrier: string, trackingNumber: string): Promise<void> {
  await shippo('/tracks/', { carrier: carrier.toLowerCase(), tracking_number: trackingNumber });
}

/** Shippo's tracking status → whether the parcel has arrived. */
export function isDelivered(status: string | null | undefined): boolean {
  return (status ?? '').toUpperCase() === 'DELIVERED';
}
