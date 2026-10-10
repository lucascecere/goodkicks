// Sold out on the shelf → pre-order, automatically.
//
// How Townies actually runs (Lucas, 2026-10-10): blanks come in 50+ at a time,
// Dylan prints ~5 of each town onto them, and those 5 are the in-stock count.
// Once they're gone we keep taking orders and print to order, so a town hat is
// never "sold out", only "in stock" or "pre-order".
//
// In-stock hats stay `DENY` so checkout can't oversell the printed units. The
// moment one reaches 0 this flips it to a real pre-order, the same three
// things done by hand before:
//   1. `preorder` tag            → site shows Pre-order + the ship note
//   2. variants `CONTINUE`       → Shopify keeps selling past 0
//   3. variants → "Pre-order" delivery profile → flat $5 pre-order shipping
//
// Runs after every order (orders webhook) and once a day (review cron) as the
// backstop for a missed webhook. Going back to in stock stays manual: remove
// the tag, set DENY, move to "Hats — Standard Shipping", set the count.

import { revalidateTag } from 'next/cache';
import { shopifyAdminGraphQL } from '@/lib/shopify/admin-graphql';
import { TOWNIES_COLLECTION } from '@/lib/shopify/collections';
import { PREORDER_TAG } from '@/lib/townies/preorder';

const PREORDER_PROFILE_ID =
  process.env.SHOPIFY_PREORDER_PROFILE_ID || 'gid://shopify/DeliveryProfile/107022975131';

type Variant = {
  id: string;
  inventoryPolicy: 'DENY' | 'CONTINUE';
  inventoryQuantity: number | null;
  inventoryItem: { tracked: boolean } | null;
};
type Product = {
  id: string;
  title: string;
  status: string;
  tags: string[];
  variants: { nodes: Variant[] };
};

const QUERY = `
  query TowniesStock($handle: String!) {
    collectionByHandle(handle: $handle) {
      products(first: 100) {
        nodes {
          id title status tags
          variants(first: 20) {
            nodes { id inventoryPolicy inventoryQuantity inventoryItem { tracked } }
          }
        }
      }
    }
  }
`;

/** A tracked, stop-at-zero hat whose every variant is at or below 0. */
function soldOutOnShelf(p: Product): boolean {
  if (p.status !== 'ACTIVE') return false;
  if (p.tags.some((t) => t.toLowerCase() === PREORDER_TAG)) return false;
  const vs = p.variants.nodes;
  return (
    vs.length > 0 &&
    vs.every(
      (v) =>
        v.inventoryItem?.tracked === true &&
        v.inventoryPolicy === 'DENY' &&
        typeof v.inventoryQuantity === 'number' &&
        v.inventoryQuantity <= 0,
    )
  );
}

async function flip(p: Product): Promise<void> {
  const variantIds = p.variants.nodes.map((v) => v.id);
  const errs: string[] = [];

  const tag = await shopifyAdminGraphQL<{ tagsAdd: { userErrors: { message: string }[] } }>(
    `mutation($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }`,
    { id: p.id, tags: [PREORDER_TAG] },
  );
  errs.push(...tag.tagsAdd.userErrors.map((e) => e.message));

  const policy = await shopifyAdminGraphQL<{
    productVariantsBulkUpdate: { userErrors: { message: string }[] };
  }>(
    `mutation($p: ID!, $v: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $p, variants: $v) { userErrors { message } }
    }`,
    { p: p.id, v: variantIds.map((id) => ({ id, inventoryPolicy: 'CONTINUE' })) },
  );
  errs.push(...policy.productVariantsBulkUpdate.userErrors.map((e) => e.message));

  const profile = await shopifyAdminGraphQL<{
    deliveryProfileUpdate: { userErrors: { message: string }[] };
  }>(
    `mutation($id: ID!, $profile: DeliveryProfileInput!) {
      deliveryProfileUpdate(id: $id, profile: $profile) { userErrors { message } }
    }`,
    { id: PREORDER_PROFILE_ID, profile: { variantsToAssociate: variantIds } },
  );
  errs.push(...profile.deliveryProfileUpdate.userErrors.map((e) => e.message));

  if (errs.length) throw new Error(`${p.title}: ${errs.join('; ')}`);
}

/** Flip every Townies hat that just ran out of printed stock. Returns titles flipped. */
export async function sweepSoldOutToPreorder(): Promise<{ flipped: string[]; failed: string[] }> {
  const data = await shopifyAdminGraphQL<{
    collectionByHandle: { products: { nodes: Product[] } } | null;
  }>(QUERY, { handle: TOWNIES_COLLECTION });

  const flipped: string[] = [];
  const failed: string[] = [];
  for (const p of (data.collectionByHandle?.products.nodes ?? []).filter(soldOutOnShelf)) {
    try {
      await flip(p);
      flipped.push(p.title);
    } catch (err) {
      console.error('[preorder-fallback]', err);
      failed.push(p.title);
    }
  }

  if (flipped.length) {
    console.log('[preorder-fallback] now pre-order:', flipped.join(', '));
    revalidateTag('shopify-collections', { expire: 0 });
    revalidateTag('shopify-stock', { expire: 0 });
  }
  return { flipped, failed };
}
