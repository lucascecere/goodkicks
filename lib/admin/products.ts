import 'server-only';
import { isShopifyAdminConfigured, shopifyAdminGraphQL } from '@/lib/shopify/admin-graphql';

// The admin's product list.
//
// Town hats and Good Kicks still live in Shopify, so this reads them through
// the Admin API (the token has `read_products`) and shows them read-only, with
// a link to edit in Shopify. Marketplace products, and later the town hats,
// live in our own tables and become editable here.

export type AdminVariant = {
  id: string;
  title: string;
  price: number;
  /** null when the hat isn't stock-tracked. */
  stock: number | null;
  sellsAtZero: boolean;
};

export type AdminProduct = {
  id: string;
  title: string;
  handle: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  image: string | null;
  tags: string[];
  preorder: boolean;
  brand: 'townies' | 'goodkicks';
  totalStock: number | null;
  priceMin: number;
  priceMax: number;
  variants: AdminVariant[];
  editUrl: string;
};

type Node = {
  id: string;
  title: string;
  handle: string;
  status: AdminProduct['status'];
  tags: string[];
  featuredImage: { url: string } | null;
  collections: { nodes: { handle: string }[] };
  variants: {
    nodes: {
      id: string;
      title: string;
      price: string;
      inventoryQuantity: number | null;
      inventoryPolicy: 'DENY' | 'CONTINUE';
      inventoryItem: { tracked: boolean } | null;
    }[];
  };
};

const QUERY = `
  query AdminProducts($after: String) {
    products(first: 100, after: $after, sortKey: TITLE) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id title handle status tags
        featuredImage { url(transform: { maxWidth: 160, maxHeight: 160 }) }
        collections(first: 10) { nodes { handle } }
        variants(first: 30) {
          nodes {
            id title price inventoryQuantity inventoryPolicy
            inventoryItem { tracked }
          }
        }
      }
    }
  }
`;

const GK_COLLECTION = process.env.SHOPIFY_GOODKICKS_COLLECTION || 'the-good-kicks-v1';
const STORE_ADMIN = 'https://admin.shopify.com/store/good-kicks-foot-bags-2/products';

function toProduct(n: Node): AdminProduct {
  const variants: AdminVariant[] = n.variants.nodes.map((v) => ({
    id: v.id,
    title: v.title,
    price: parseFloat(v.price),
    stock: v.inventoryItem?.tracked ? (v.inventoryQuantity ?? 0) : null,
    sellsAtZero: v.inventoryPolicy === 'CONTINUE',
  }));
  const tracked = variants.filter((v) => v.stock !== null);
  const prices = variants.map((v) => v.price);
  return {
    id: n.id,
    title: n.title,
    handle: n.handle,
    status: n.status,
    image: n.featuredImage?.url ?? null,
    tags: n.tags,
    preorder: n.tags.some((t) => t.toLowerCase() === 'preorder'),
    brand: n.collections.nodes.some((c) => c.handle === GK_COLLECTION) ? 'goodkicks' : 'townies',
    totalStock: tracked.length ? tracked.reduce((s, v) => s + Math.max(0, v.stock ?? 0), 0) : null,
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 0,
    variants,
    editUrl: `${STORE_ADMIN}/${n.id.split('/').pop()}`,
  };
}

export type ProductsResult = { products: AdminProduct[]; configured: boolean; error: string | null };

export async function listShopifyProducts(): Promise<ProductsResult> {
  if (!isShopifyAdminConfigured()) return { products: [], configured: false, error: null };
  const out: AdminProduct[] = [];
  let after: string | null = null;
  try {
    for (let page = 0; page < 10; page++) {
      const data: { products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: Node[] } } =
        await shopifyAdminGraphQL(QUERY, { after });
      out.push(...data.products.nodes.map(toProduct));
      if (!data.products.pageInfo.hasNextPage) break;
      after = data.products.pageInfo.endCursor;
    }
  } catch (err) {
    return { products: out, configured: true, error: err instanceof Error ? err.message : 'Shopify read failed' };
  }
  return { products: out, configured: true, error: null };
}
