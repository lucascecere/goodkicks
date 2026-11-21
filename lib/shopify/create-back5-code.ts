import 'server-only';
import { shopifyAdminGraphQL } from './admin-graphql';

// One-use "$5 off your order" code for an abandoned-checkout email.
// Same shape as the first-order HELLO5 code: $5 off the whole order (bundles
// sit outside the hat collection), one use, combines with shipping discounts so
// it still works on a $75+ order that already ships free.

export const BACK5_VALID_DAYS = 7;
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function suffix(len = 6): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

type UserError = { field: string[] | null; code?: string | null; message: string };

export async function mintBack5Code(): Promise<{ code: string; gid: string; expiresAt: string }> {
  const startsAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + BACK5_VALID_DAYS * 24 * 60 * 60 * 1000).toISOString();
  let last: UserError[] = [];

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = `BACK5-${suffix()}`;
    const data = await shopifyAdminGraphQL<{
      discountCodeBasicCreate: { codeDiscountNode: { id: string } | null; userErrors: UserError[] };
    }>(
      `mutation($d: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $d) { codeDiscountNode { id } userErrors { field code message } }
      }`,
      {
        d: {
          title: 'Abandoned checkout: $5 off',
          code,
          startsAt,
          endsAt: expiresAt,
          customerSelection: { all: true },
          customerGets: {
            value: { discountAmount: { amount: '5.00', appliesOnEachItem: false } },
            items: { all: true },
          },
          appliesOncePerCustomer: true,
          usageLimit: 1,
          combinesWith: { shippingDiscounts: true },
        },
      },
    );
    const p = data.discountCodeBasicCreate;
    if (p.codeDiscountNode && !p.userErrors.length) return { code, gid: p.codeDiscountNode.id, expiresAt };
    last = p.userErrors;
    if (!p.userErrors.some((e) => e.code === 'TAKEN' || /taken|already/i.test(e.message))) break;
  }
  throw new Error(last.map((e) => e.message).join(', ') || 'Shopify refused to create the BACK5 code.');
}
