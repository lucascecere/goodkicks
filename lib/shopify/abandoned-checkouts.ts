import 'server-only';
import { shopifyAdminGraphQL } from './admin-graphql';
import { TWO_TOWN_DEAL } from '@/lib/townies/two-town-deal';

// Abandoned checkouts worth a recovery email.
//
// Shopify keeps every checkout that got as far as an email address and was
// never paid for. We read the recent ones and keep a checkout only when:
//   - it is between MIN_AGE and MAX_AGE old (give them an hour to finish on
//     their own; after two days the moment has passed),
//   - it has an email and was never completed,
//   - at least one line is a Townies item (`_brand` line attribute, or the
//     product sits in the `townies` collection). Pure Good Kicks checkouts are
//     skipped: this email is Townies-branded and sent from info@townies.shop,
//   - that email has NOT ordered since the checkout, nor in the 24 hours before
//     it (checked in the cron route). People bounce out of checkout and come back
//     through the site, which makes a fresh checkout and an order while the old
//     one stays "abandoned"; others open a second checkout right after paying.
//
// Dedupe against what we already emailed happens in the cron route.

const MIN_AGE_MS = 60 * 60 * 1000;
const MAX_AGE_MS = 48 * 60 * 60 * 1000;

export type AbandonedLine = {
  title: string;
  quantity: number;
  imageUrl: string | null;
  handle: string | null;
};

export type AbandonedCheckout = {
  id: string;
  createdAt: string;
  recoveryUrl: string;
  email: string;
  firstName: string | null;
  /** Codes already on the checkout. Non-empty = they had a promo, so no $5. */
  discountCodes: string[];
  subtotal: number;
  lines: AbandonedLine[];
  /** Hat units on the checkout (productType "Hats"), for the two-town deal. */
  hatUnits: number;
};

type RawNode = {
  id: string;
  createdAt: string;
  completedAt: string | null;
  abandonedCheckoutUrl: string;
  customer: { email: string | null; firstName: string | null } | null;
  discountCodes: string[];
  subtotalPriceSet: { shopMoney: { amount: string } };
  lineItems: {
    nodes: {
      title: string;
      quantity: number;
      customAttributes: { key: string; value: string | null }[];
      image: { url: string } | null;
      variant: {
        product: { handle: string; productType: string | null; featuredImage: { url: string } | null; inCollection: boolean } | null;
      } | null;
    }[];
  };
};

async function townCollectionGid(): Promise<string | null> {
  const data = await shopifyAdminGraphQL<{ collectionByHandle: { id: string } | null }>(
    `{ collectionByHandle(handle: "townies") { id } }`,
  );
  return data.collectionByHandle?.id ?? null;
}

function isTowniesLine(line: RawNode['lineItems']['nodes'][number]): boolean {
  const brand = line.customAttributes.find((a) => a.key === '_brand')?.value;
  if (brand === 'townies') return true;
  if (brand === 'goodkicks') return false;
  return Boolean(line.variant?.product?.inCollection);
}

/** Has this email ordered anything since `since`? Fails closed (true) so a lookup error never emails a buyer. */
export async function orderedSince(email: string, since: string): Promise<boolean> {
  try {
    const safe = email.replace(/["\\]/g, '');
    const data = await shopifyAdminGraphQL<{ orders: { nodes: { id: string; cancelledAt: string | null }[] } }>(
      `query($q: String!) { orders(first: 5, query: $q) { nodes { id cancelledAt } } }`,
      { q: `email:"${safe}" created_at:>='${since}'` },
    );
    return data.orders.nodes.some((o) => !o.cancelledAt);
  } catch (err) {
    console.error('[abandoned] order lookup failed:', err);
    return true;
  }
}

export async function listRecoverableCheckouts(now = Date.now()): Promise<AbandonedCheckout[]> {
  const collection = await townCollectionGid();
  const data = await shopifyAdminGraphQL<{ abandonedCheckouts: { nodes: RawNode[] } }>(
    `query($c: ID!) {
      abandonedCheckouts(first: 50, reverse: true) {
        nodes {
          id createdAt completedAt abandonedCheckoutUrl
          customer { email firstName }
          discountCodes
          subtotalPriceSet { shopMoney { amount } }
          lineItems(first: 10) {
            nodes {
              title quantity
              customAttributes { key value }
              image { url }
              variant { product { handle productType featuredImage { url } inCollection(id: $c) } }
            }
          }
        }
      }
    }`,
    // A dummy id when the collection is missing: inCollection is then false
    // and we fall back to the `_brand` attribute alone.
    { c: collection ?? 'gid://shopify/Collection/0' },
  );

  const out: AbandonedCheckout[] = [];
  for (const n of data.abandonedCheckouts.nodes) {
    const age = now - new Date(n.createdAt).getTime();
    if (age < MIN_AGE_MS || age > MAX_AGE_MS) continue;
    if (n.completedAt) continue;
    const email = n.customer?.email?.trim().toLowerCase();
    if (!email) continue;
    if (!n.lineItems.nodes.some(isTowniesLine)) continue;

    out.push({
      id: n.id,
      createdAt: n.createdAt,
      recoveryUrl: n.abandonedCheckoutUrl,
      email,
      firstName: n.customer?.firstName?.trim() || null,
      discountCodes: n.discountCodes ?? [],
      subtotal: Number(n.subtotalPriceSet.shopMoney.amount),
      hatUnits: n.lineItems.nodes
        .filter((l) => l.variant?.product?.productType === TWO_TOWN_DEAL.hatProductType)
        .reduce((sum, l) => sum + l.quantity, 0),
      lines: n.lineItems.nodes.map((l) => ({
        title: l.title,
        quantity: l.quantity,
        imageUrl: l.image?.url ?? l.variant?.product?.featuredImage?.url ?? null,
        handle: l.variant?.product?.handle ?? null,
      })),
    });
  }
  return out;
}

/**
 * The link in the email. With a code it goes through Shopify's /discount route
 * on the checkout domain, which sets the discount cookie and then redirects to
 * the saved checkout, so the $5 is already applied when it opens (verified
 * 2026-11-20 on checkout.townies.shop: $29.99 hat showed "Order discount − $5.00").
 */
export function recoveryLink(recoveryUrl: string, code: string | null): string {
  if (!code) return recoveryUrl;
  const u = new URL(recoveryUrl);
  return `${u.origin}/discount/${encodeURIComponent(code)}?redirect=${encodeURIComponent(u.pathname + u.search)}`;
}
