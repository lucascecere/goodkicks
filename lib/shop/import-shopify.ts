import 'server-only';
import { shopifyAdminGraphQL } from '@/lib/shopify/admin-graphql';
import { db, getSellerBySlug } from './db';
import { WHOLESALE_CENTS } from './money';

// Copy the Shopify catalog into our own tables, as the Townies (house) seller.
//
// READ-ONLY on Shopify: nothing there changes. New products arrive as DRAFTS,
// so nothing new shows anywhere. Re-running refreshes price, stock, photos,
// tags and copy from Shopify (still the source of truth until we switch), but
// never touches a product's status or slug, so a hat we've turned on stays on.

type Node = {
  id: string;
  title: string;
  handle: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  description: string;
  tags: string[];
  featuredImage: { url: string } | null;
  images: { nodes: { url: string }[] };
  collections: { nodes: { handle: string }[] };
  variants: {
    nodes: {
      id: string;
      price: string;
      compareAtPrice: string | null;
      inventoryQuantity: number | null;
      inventoryItem: { tracked: boolean } | null;
    }[];
  };
};

const QUERY = `
  query Catalog($after: String) {
    products(first: 50, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id title handle status description tags
        featuredImage { url }
        images(first: 10) { nodes { url } }
        collections(first: 10) { nodes { handle } }
        variants(first: 5) { nodes { id price compareAtPrice inventoryQuantity inventoryItem { tracked } } }
      }
    }
  }
`;

const REGIONS = ['south-shore', 'boston', 'south-east', 'north-shore', 'cape-cod', 'metro-west', 'central-mass', 'western-mass', 'greater-boston'];
const GK_COLLECTION = process.env.SHOPIFY_GOODKICKS_COLLECTION || 'the-good-kicks-v1';

function cents(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = Math.round(parseFloat(v) * 100);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function kindOf(n: Node): 'hat' | 'foot_bag' | 'bundle' | 'internal' {
  const tags = n.tags.map((t) => t.toLowerCase());
  if (tags.includes('internal') || tags.includes('not-for-sale') || /package/i.test(n.title)) return 'internal';
  if (tags.includes('bundle') || /bundle|3-pack/i.test(n.title + n.handle)) return 'bundle';
  if (tags.includes('foot-bag') || n.collections.nodes.some((c) => c.handle === GK_COLLECTION)) return 'foot_bag';
  return 'hat';
}

/** "town:West Roxbury" tag wins; otherwise the title up to the style word. */
function townOf(n: Node): string | null {
  const tag = n.tags.find((t) => t.toLowerCase().startsWith('town:'));
  if (tag) return tag.slice(5).trim();
  const m = n.title.match(/^(.+?)\s+(Lifestyle|Everyday|'|Classic|Snapback)/i);
  return m ? m[1].trim() : null;
}

export type ImportResult = { created: number; updated: number; skipped: string[] };

export async function importShopifyCatalog(): Promise<ImportResult> {
  const house = await getSellerBySlug('townies');
  if (!house) throw new Error('The Townies seller row is missing.');

  const nodes: Node[] = [];
  let after: string | null = null;
  for (let page = 0; page < 10; page++) {
    const data: { products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: Node[] } } =
      await shopifyAdminGraphQL(QUERY, { after });
    nodes.push(...data.products.nodes);
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }

  const { data: existing } = await db().from('shop_products').select('id, shopify_product_id').eq('seller_id', house.id);
  const byShopify = new Map((existing ?? []).map((r) => [r.shopify_product_id as string, r.id as string]));

  const result: ImportResult = { created: 0, updated: 0, skipped: [] };
  for (const n of nodes) {
    const v = n.variants.nodes[0];
    const price = cents(v?.price);
    const kind = kindOf(n);
    if (!v || !price || kind === 'internal') {
      result.skipped.push(n.title);
      continue;
    }
    const tags = n.tags.map((t) => t.toLowerCase());
    const lifestyle = tags.includes('lifestyle') || /lifestyle|classic/i.test(n.title);
    const images = [n.featuredImage?.url, ...n.images.nodes.map((i) => i.url)].filter(
      (u, i, a): u is string => Boolean(u) && a.indexOf(u) === i,
    );
    const fields = {
      title: n.title,
      description: n.description || null,
      image_url: images[0] ?? null,
      images,
      tags: n.tags,
      kind,
      preorder: tags.includes('preorder'),
      region: n.collections.nodes.map((c) => c.handle).find((h) => REGIONS.includes(h)) ?? tags.find((t) => REGIONS.includes(t)) ?? null,
      town: kind === 'hat' ? townOf(n) : null,
      price_cents: price,
      compare_at_cents: cents(v.compareAtPrice),
      wholesale_type: lifestyle ? 'lifestyle' : 'everyday',
      wholesale_cents: WHOLESALE_CENTS[lifestyle ? 'lifestyle' : 'everyday'],
      on_hand: v.inventoryItem?.tracked ? (v.inventoryQuantity ?? 0) : 0,
      shopify_variant_id: v.id,
      updated_at: new Date().toISOString(),
    };

    const id = byShopify.get(n.id);
    if (id) {
      const { error } = await db().from('shop_products').update(fields).eq('id', id);
      if (error) throw new Error(`${n.title}: ${error.message}`);
      result.updated++;
    } else {
      const { error } = await db()
        .from('shop_products')
        .insert({ ...fields, seller_id: house.id, slug: n.handle, shopify_product_id: n.id, status: 'draft' });
      if (error) throw new Error(`${n.title}: ${error.message}`);
      result.created++;
    }
  }
  return result;
}
