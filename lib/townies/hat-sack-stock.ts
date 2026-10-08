import 'server-only';
import { shopifyAdminGraphQL } from '@/lib/shopify/admin-graphql';
import type { ShopifyLineItem } from '@/lib/shopify/orders-source';

/**
 * Hat & Sack stock (2026-10-08). The bundle is its own untracked product, so
 * selling one would not touch the hat's or the bag's stock and both could
 * oversell. On every new order, each bundle line takes one of its chosen hat
 * and one of its chosen bag off the shelf (ids from the hidden `_hat_variant` /
 * `_sack_variant` line properties the picker writes).
 *
 * Idempotent: the order gets a `bundle-stock-adjusted` tag after the first
 * successful run, and a retried webhook sees the tag and does nothing.
 */
const DONE_TAG = 'bundle-stock-adjusted';
const LOCATION = 'gid://shopify/Location/86071214235'; // Hingham Warehouse, the only location

type Line = ShopifyLineItem & { product_id?: number | null; sku?: string | null };

export async function adjustBundleStock(orderId: number | string, lines: Line[]): Promise<void> {
  const deltas = new Map<string, number>();
  for (const li of lines) {
    const props = li.properties ?? [];
    const hat = props.find((p) => p.name === '_hat_variant')?.value;
    const sack = props.find((p) => p.name === '_sack_variant')?.value;
    if (!hat && !sack) continue;
    for (const v of [hat, sack]) if (v) deltas.set(v, (deltas.get(v) ?? 0) - (li.quantity || 1));
  }
  if (deltas.size === 0) return;

  const orderGid = `gid://shopify/Order/${orderId}`;
  const tagged = await shopifyAdminGraphQL<{ order: { tags: string[] } | null }>(
    'query($id: ID!) { order(id: $id) { tags } }',
    { id: orderGid },
  );
  if (tagged.order?.tags?.includes(DONE_TAG)) return;

  const changes: Array<{ inventoryItemId: string; locationId: string; delta: number }> = [];
  for (const [variantId, delta] of deltas) {
    const v = await shopifyAdminGraphQL<{ productVariant: { inventoryItem: { id: string; tracked: boolean } } | null }>(
      'query($id: ID!) { productVariant(id: $id) { inventoryItem { id tracked } } }',
      { id: variantId },
    );
    const item = v.productVariant?.inventoryItem;
    if (item?.tracked) changes.push({ inventoryItemId: item.id, locationId: LOCATION, delta });
  }
  if (changes.length) {
    const r = await shopifyAdminGraphQL<{ inventoryAdjustQuantities: { userErrors: Array<{ message: string }> } }>(
      `mutation($input: InventoryAdjustQuantitiesInput!) {
        inventoryAdjustQuantities(input: $input) { userErrors { message } }
      }`,
      { input: { name: 'available', reason: 'correction', referenceDocumentUri: `gid://townies/HatSackOrder/${orderId}`, changes } },
    );
    const errs = r.inventoryAdjustQuantities.userErrors;
    if (errs.length) throw new Error(errs.map((e) => e.message).join('; '));
  }
  await shopifyAdminGraphQL('mutation($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }', {
    id: orderGid,
    tags: [DONE_TAG],
  });
}
