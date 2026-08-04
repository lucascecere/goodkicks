// Rep / ambassador discount codes in Shopify.
//
// Codes are scoped to a single collection so a Townies Town Rep's code
// discounts Townies hats only and never touches Good Kicks stock (and vice
// versa). The percentage a customer saves (`discountPct`) is deliberately
// separate from the percentage the rep earns — the old implementation used one
// number for both, which is why an "8% commission" rep minted a code called
// `…8` giving 8% off.

import {
  shopifyAdminGraphQL,
  ShopifyScopeError,
  ShopifyNotConfiguredError,
} from './admin-graphql';
import { TOWNIES_COLLECTION, GOODKICKS_COLLECTION } from './collections';
import type { RealBrand } from '@/lib/admin/brand';

export { ShopifyScopeError, ShopifyNotConfiguredError };

const CREATE_DISCOUNT_MUTATION = `
  mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            codes(first: 1) { nodes { code } }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

const UPDATE_DISCOUNT_MUTATION = `
  mutation discountCodeBasicUpdate($id: ID!, $basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicUpdate(id: $id, basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            codes(first: 1) { nodes { code } }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

const COLLECTION_GID_QUERY = `
  query CollectionGid($handle: String!) {
    collectionByHandle(handle: $handle) { id }
  }
`;

/** Which collection a brand's rep codes are limited to. */
export function collectionForBrand(brand: RealBrand): string {
  return brand === 'townies' ? TOWNIES_COLLECTION : GOODKICKS_COLLECTION;
}

// Handles are stable, so cache the lookup for the life of the process.
const gidCache = new Map<string, string>();

export async function resolveCollectionGid(handle: string): Promise<string> {
  const cached = gidCache.get(handle);
  if (cached) return cached;

  const data = await shopifyAdminGraphQL<{ collectionByHandle: { id: string } | null }>(
    COLLECTION_GID_QUERY,
    { handle },
  );
  const gid = data.collectionByHandle?.id;
  if (!gid) throw new Error(`Shopify collection "${handle}" not found.`);

  gidCache.set(handle, gid);
  return gid;
}

/** Normalise any free-text label into a valid, readable code fragment. */
export function slugifyCode(input: string): string {
  return input.replace(/^@/, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Suggested code for a rep, e.g. town "Milton" at 15% off → MILTON15. */
export function suggestCode(label: string, discountPct: number): string {
  const slug = slugifyCode(label);
  return slug ? `${slug}${discountPct}` : '';
}

type DiscountResult = { code: string; gid: string };

function readUserErrors(errors: { field: string[] | null; message: string }[] | undefined) {
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(', '));
  }
}

export async function createRepDiscountCode({
  code,
  discountPct,
  brand,
  title,
}: {
  code: string;
  discountPct: number;
  brand: RealBrand;
  title: string;
}): Promise<DiscountResult> {
  const collectionGid = await resolveCollectionGid(collectionForBrand(brand));

  const data = await shopifyAdminGraphQL<{
    discountCodeBasicCreate: {
      codeDiscountNode: {
        id: string;
        codeDiscount: { codes?: { nodes?: { code: string }[] } };
      } | null;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(CREATE_DISCOUNT_MUTATION, {
    basicCodeDiscount: {
      title,
      code,
      startsAt: new Date().toISOString(),
      customerSelection: { all: true },
      customerGets: {
        value: { percentage: discountPct / 100 },
        items: { collections: { add: [collectionGid] } },
      },
      usageLimit: null,
      appliesOncePerCustomer: false,
    },
  });

  readUserErrors(data.discountCodeBasicCreate.userErrors);

  const node = data.discountCodeBasicCreate.codeDiscountNode;
  if (!node) throw new Error('Shopify did not return the created discount.');

  return {
    code: node.codeDiscount?.codes?.nodes?.[0]?.code ?? code,
    gid: node.id,
  };
}

/**
 * Push a changed discount percentage back to the live Shopify code, so the
 * admin and the storefront can't drift apart.
 */
export async function updateRepDiscountCode({
  gid,
  discountPct,
}: {
  gid: string;
  discountPct: number;
}): Promise<DiscountResult> {
  const data = await shopifyAdminGraphQL<{
    discountCodeBasicUpdate: {
      codeDiscountNode: {
        id: string;
        codeDiscount: { codes?: { nodes?: { code: string }[] } };
      } | null;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(UPDATE_DISCOUNT_MUTATION, {
    id: gid,
    basicCodeDiscount: {
      customerGets: { value: { percentage: discountPct / 100 } },
    },
  });

  readUserErrors(data.discountCodeBasicUpdate.userErrors);

  const node = data.discountCodeBasicUpdate.codeDiscountNode;
  if (!node) throw new Error('Shopify did not return the updated discount.');

  return {
    code: node.codeDiscount?.codes?.nodes?.[0]?.code ?? '',
    gid: node.id,
  };
}
