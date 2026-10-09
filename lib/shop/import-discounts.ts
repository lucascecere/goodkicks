import 'server-only';
import { shopifyAdminGraphQL } from '@/lib/shopify/admin-graphql';
import { db } from './db';
import { normalizeCode } from './discounts';

// Copy the ACTIVE Shopify discount codes into shop_discounts. Read-only on
// Shopify. Re-running refreshes each code (usage count, dates, value).
//
// While both checkouts exist, a code's uses are counted separately in each,
// so a one-time code could in theory be used once in each. That gap closes
// when the town hats switch over and Shopify stops taking orders.

type Money = { amount: string };
type Node = {
  id: string;
  codeDiscount: {
    __typename: string;
    title?: string;
    status?: string;
    startsAt?: string | null;
    endsAt?: string | null;
    usageLimit?: number | null;
    asyncUsageCount?: number;
    appliesOncePerCustomer?: boolean;
    codes?: { nodes: { code: string }[] };
    customerGets?: {
      value: { __typename: string; percentage?: number; amount?: Money };
      items: { __typename: string; collections?: { nodes: { handle: string }[] } };
    };
    minimumRequirement?: { __typename: string; greaterThanOrEqualToSubtotal?: Money } | null;
  };
};

const FIELDS = `
  title status startsAt endsAt usageLimit asyncUsageCount appliesOncePerCustomer
  codes(first: 1) { nodes { code } }
  minimumRequirement { __typename ... on DiscountMinimumSubtotal { greaterThanOrEqualToSubtotal { amount } } }
`;

const QUERY = `
  query Codes($after: String) {
    codeDiscountNodes(first: 100, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        codeDiscount {
          __typename
          ... on DiscountCodeBasic {
            ${FIELDS}
            customerGets {
              value { __typename ... on DiscountPercentage { percentage } ... on DiscountAmount { amount { amount } } }
              items { __typename ... on DiscountCollections { collections(first: 5) { nodes { handle } } } }
            }
          }
          ... on DiscountCodeFreeShipping { ${FIELDS} }
        }
      }
    }
  }
`;

const GK_COLLECTION = process.env.SHOPIFY_GOODKICKS_COLLECTION || 'the-good-kicks-v1';

function sourceOf(title: string): 'rep' | 'partner' | 'quiz' | 'welcome' | 'shopify_import' {
  if (/rep\b|ambassador/i.test(title)) return 'rep';
  if (/partner/i.test(title)) return 'partner';
  if (/trivia|rotary|spin/i.test(title)) return 'quiz';
  if (/welcome/i.test(title)) return 'welcome';
  return 'shopify_import';
}

export async function importShopifyDiscounts(): Promise<{ created: number; updated: number; skipped: number }> {
  const nodes: Node[] = [];
  let after: string | null = null;
  for (let page = 0; page < 20; page++) {
    const data: { codeDiscountNodes: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: Node[] } } =
      await shopifyAdminGraphQL(QUERY, { after });
    nodes.push(...data.codeDiscountNodes.nodes);
    if (!data.codeDiscountNodes.pageInfo.hasNextPage) break;
    after = data.codeDiscountNodes.pageInfo.endCursor;
  }

  // Link rep codes to the rep, so rep sales can be counted from our orders.
  const { data: reps } = await db().from('ambassador_applications').select('id, discount_code').not('discount_code', 'is', null);
  const repByCode = new Map((reps ?? []).map((r) => [normalizeCode(String(r.discount_code)), r.id as string]));

  const { data: existing } = await db().from('shop_discounts').select('id, shopify_discount_id');
  const known = new Map((existing ?? []).map((r) => [r.shopify_discount_id as string, r.id as string]));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  for (const n of nodes) {
    const d = n.codeDiscount;
    const code = d.codes?.nodes[0]?.code;
    const isBasic = d.__typename === 'DiscountCodeBasic';
    const isShip = d.__typename === 'DiscountCodeFreeShipping';
    if (!code || (!isBasic && !isShip) || d.status !== 'ACTIVE') {
      skipped++;
      continue;
    }
    const v = d.customerGets?.value;
    const kind = isShip ? 'free_shipping' : v?.__typename === 'DiscountPercentage' ? 'percent' : 'fixed';
    const value =
      kind === 'percent' ? Math.round((v?.percentage ?? 0) * 100) : kind === 'fixed' ? Math.round(parseFloat(v?.amount?.amount ?? '0') * 100) : 0;
    const handles = d.customerGets?.items.collections?.nodes.map((c) => c.handle) ?? [];
    const scope = !handles.length ? 'all' : handles.includes(GK_COLLECTION) && handles.length === 1 ? 'foot_bags' : handles.includes(GK_COLLECTION) ? 'all' : 'hats';
    const row = {
      code: normalizeCode(code),
      kind,
      value,
      scope,
      min_subtotal_cents: Math.round(parseFloat(d.minimumRequirement?.greaterThanOrEqualToSubtotal?.amount ?? '0') * 100),
      starts_at: d.startsAt ?? null,
      ends_at: d.endsAt ?? null,
      usage_limit: d.usageLimit ?? null,
      used_count: d.asyncUsageCount ?? 0,
      once_per_email: Boolean(d.appliesOncePerCustomer),
      source: sourceOf(d.title ?? ''),
      rep_id: repByCode.get(normalizeCode(code)) ?? null,
      note: d.title ?? null,
      active: true,
      shopify_discount_id: n.id,
      updated_at: new Date().toISOString(),
    };
    const id = known.get(n.id);
    const res = id ? await db().from('shop_discounts').update(row).eq('id', id) : await db().from('shop_discounts').insert(row);
    if (res.error) {
      // A code we made by hand with the same name wins; skip the Shopify copy.
      if (/duplicate key/i.test(res.error.message)) {
        skipped++;
        continue;
      }
      throw new Error(`${code}: ${res.error.message}`);
    }
    if (id) updated++;
    else created++;
  }
  return { created, updated, skipped };
}
