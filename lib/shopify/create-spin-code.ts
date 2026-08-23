// Single-use discount codes for the rotary spin.
//
// Deliberately NOT the shared-code approach (one KICKS10 that everybody gets).
// A shared code is on a coupon-scraper site within a week and then every order
// carries it forever, including orders that were never going to need a nudge.
// Each spin mints its own code: usage limit 1, expires in CODE_VALID_DAYS,
// scoped to the Townies collection where Shopify allows scoping.
//
// The percentage path reuses discountCodeBasicCreate (same mutation the rep
// program uses). Free shipping is a different Shopify object entirely, hence
// the second mutation below.
//
// KNOWN LIMIT — free shipping cannot be collection-scoped. Shopify's free
// shipping discount applies to the ORDER's shipping line, and there is no
// "shipping for these products only". One store serves both brands, so a
// Townies free-ship code will also zero the shipping on a Good Kicks order.
// If that's not acceptable, drop the free-ship wedges from
// lib/townies/spin-prizes.ts — nothing else has to change.

import {
  shopifyAdminGraphQL,
  ShopifyScopeError,
  ShopifyNotConfiguredError,
} from './admin-graphql';
import { resolveCollectionGid, collectionForBrand } from './create-discount-code';
import { CODE_VALID_DAYS, type SpinWedge } from '@/lib/townies/spin-prizes';
import type { RealBrand } from '@/lib/admin/brand';

export { ShopifyScopeError, ShopifyNotConfiguredError };

const CREATE_BASIC = `
  mutation spinBasic($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount { ... on DiscountCodeBasic { codes(first: 1) { nodes { code } } } }
      }
      userErrors { field code message }
    }
  }
`;

const CREATE_FREE_SHIPPING = `
  mutation spinFreeShipping($freeShippingCodeDiscount: DiscountCodeFreeShippingInput!) {
    discountCodeFreeShippingCreate(freeShippingCodeDiscount: $freeShippingCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount { ... on DiscountCodeFreeShipping { codes(first: 1) { nodes { code } } } }
      }
      userErrors { field code message }
    }
  }
`;

type UserError = { field: string[] | null; code?: string | null; message: string };

/** Shopify's userErrors code when the requested discount code is already taken. */
function isTakenError(errors: UserError[]): boolean {
  return errors.some(
    (e) => e.code === 'TAKEN' || /already (exists|been used|in use)|taken/i.test(e.message),
  );
}

// Crockford-ish alphabet: no 0/O/1/I/L, because this code gets read off a phone
// screen and typed into a checkout box by hand.
const SUFFIX_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function randomSuffix(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) out += SUFFIX_ALPHABET[bytes[i] % SUFFIX_ALPHABET.length];
  return out;
}

/**
 * Uppercased unconditionally: the unique index in spin_claims and the webhook's
 * redemption match both work on the upper-cased code, so a lower-case
 * codePrefix typed into the prize table would silently break attribution.
 */
export function buildSpinCode(wedge: SpinWedge): string {
  return `${wedge.codePrefix.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${randomSuffix()}`;
}

export type MintedCode = {
  code: string;
  gid: string;
  expiresAt: string;
};

async function mintOnce(
  wedge: SpinWedge,
  code: string,
  brand: RealBrand,
  startsAt: string,
  endsAt: string,
): Promise<{ result?: MintedCode; errors: UserError[] }> {
  const title = `Rotary spin — ${wedge.label}`;

  if (wedge.kind === 'free_shipping') {
    const data = await shopifyAdminGraphQL<{
      discountCodeFreeShippingCreate: {
        codeDiscountNode: { id: string; codeDiscount: { codes?: { nodes?: { code: string }[] } } } | null;
        userErrors: UserError[];
      };
    }>(CREATE_FREE_SHIPPING, {
      freeShippingCodeDiscount: {
        title,
        code,
        startsAt,
        endsAt,
        customerSelection: { all: true },
        destination: { all: true },
        appliesOncePerCustomer: true,
        usageLimit: 1,
      },
    });

    const payload = data.discountCodeFreeShippingCreate;
    if (payload.userErrors?.length) return { errors: payload.userErrors };
    const node = payload.codeDiscountNode;
    if (!node) return { errors: [{ field: null, message: 'Shopify returned no discount node.' }] };

    return {
      result: { code: node.codeDiscount?.codes?.nodes?.[0]?.code ?? code, gid: node.id, expiresAt: endsAt },
      errors: [],
    };
  }

  const percentOff = wedge.percentOff;
  if (!percentOff || percentOff <= 0 || percentOff > 100) {
    throw new Error(`Wedge "${wedge.id}" is a percentage prize with no usable percentOff.`);
  }

  const collectionGid = await resolveCollectionGid(collectionForBrand(brand));

  const data = await shopifyAdminGraphQL<{
    discountCodeBasicCreate: {
      codeDiscountNode: { id: string; codeDiscount: { codes?: { nodes?: { code: string }[] } } } | null;
      userErrors: UserError[];
    };
  }>(CREATE_BASIC, {
    basicCodeDiscount: {
      title,
      code,
      startsAt,
      endsAt,
      customerSelection: { all: true },
      customerGets: {
        value: { percentage: percentOff / 100 },
        items: { collections: { add: [collectionGid] } },
      },
      appliesOncePerCustomer: true,
      usageLimit: 1,
    },
  });

  const payload = data.discountCodeBasicCreate;
  if (payload.userErrors?.length) return { errors: payload.userErrors };
  const node = payload.codeDiscountNode;
  if (!node) return { errors: [{ field: null, message: 'Shopify returned no discount node.' }] };

  return {
    result: { code: node.codeDiscount?.codes?.nodes?.[0]?.code ?? code, gid: node.id, expiresAt: endsAt },
    errors: [],
  };
}

/**
 * Mint the code for one spin.
 *
 * Retries on a collision only — a 6-character suffix over a 31-letter alphabet
 * is ~887 million combinations per prefix, so a collision means bad luck rather
 * than a bug, and a second draw fixes it. Every other userError is a real
 * problem and is raised rather than swallowed: the failure mode we are avoiding
 * is emailing somebody a code that was never created, which is exactly what
 * happened to 21 Good Kicks ambassadors.
 */
export async function mintSpinCode({
  wedge,
  brand = 'townies',
}: {
  wedge: SpinWedge;
  brand?: RealBrand;
}): Promise<MintedCode> {
  const startsAt = new Date().toISOString();
  const endsAt = new Date(Date.now() + CODE_VALID_DAYS * 24 * 60 * 60 * 1000).toISOString();

  let lastErrors: UserError[] = [];

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = buildSpinCode(wedge);
    const { result, errors } = await mintOnce(wedge, code, brand, startsAt, endsAt);
    if (result) return result;

    lastErrors = errors;
    if (!isTakenError(errors)) break;
  }

  throw new Error(
    lastErrors.map((e) => e.message).join(', ') || 'Shopify refused to create the discount code.',
  );
}
