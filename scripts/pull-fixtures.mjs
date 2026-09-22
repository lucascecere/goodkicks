#!/usr/bin/env node
/**
 * Refresh the local-dev catalogue snapshot.
 *
 *     node scripts/pull-fixtures.mjs
 *
 * WHY THIS EXISTS: every sensitive env var on the `goodkicks` Vercel project
 * comes back as an EMPTY STRING from `vercel env pull` — `SHOPIFY_STORE_DOMAIN`
 * and `SHOPIFY_STOREFRONT_ACCESS_TOKEN` included. So `next dev` cannot reach
 * the Storefront API, every collection read degrades to [], and the shop, the
 * homepage rails and the region band all render empty. Design work on any of
 * them meant deploying to look at it.
 *
 * This pulls the same products through the ADMIN API — whose token IS available
 * locally, at ~/.townies-admin/creds.json — and writes them in the Storefront
 * `CollectionProduct` shape to `.fixtures/collections.json` (gitignored).
 * `getProductsByCollection` reads that file when, and only when, there is no
 * storefront credential, which is never the case in production.
 *
 * ONLY `status: ACTIVE`, and deliberately NOT `publishedAt`.
 *
 * Both halves of that were got wrong once each, so they are worth writing down:
 *
 *  - UNLISTED is NOT on the site. It reads like "hidden from search only", but
 *    the Storefront API leaves UNLISTED products out of collection queries too.
 *    The Good Kicks Massachusetts bag is UNLISTED and does not appear on
 *    goodkicks.co/shop; its PDP 404s.
 *  - `publishedAt` is the ONLINE STORE channel and is null for products that
 *    are only on the headless "Good Kicks Foot Bags Website" publication —
 *    which is the channel this site actually reads. Requiring it dropped Good
 *    Kicks New York, a product that is live.
 *
 * Verified 2026-09-22: `status === 'ACTIVE'` alone reproduces both live
 * catalogues exactly — 13 Townies hats, 8 Good Kicks bags.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';

const CREDS = `${os.homedir()}/.townies-admin/creds.json`;

let token, domain;
try {
  ({ token, domain } = JSON.parse(readFileSync(CREDS, 'utf8')));
} catch {
  console.error(`No Shopify admin credentials at ${CREDS}.`);
  console.error('Expected { "token": "shpat_…", "domain": "….myshopify.com" }.');
  process.exit(1);
}

const QUERY = `query($handle: String!) {
  collectionByHandle(handle: $handle) {
    products(first: 100) {
      edges { node {
        id title handle tags status publishedAt
        featuredImage { url altText }
        images(first: 3) { edges { node { url altText } } }
        variants(first: 10) { edges { node { id availableForSale price inventoryQuantity } } }
      } }
    }
  }
}`;

async function pull(handle) {
  const res = await fetch(`https://${domain}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { handle } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));

  const edges = json.data?.collectionByHandle?.products?.edges ?? [];
  const live = edges.filter(({ node: n }) => n.status === 'ACTIVE');

  return {
    skipped: edges.length - live.length,
    products: live.map(({ node: n }) => ({
      id: n.id,
      title: n.title,
      handle: n.handle,
      tags: n.tags,
      featuredImage: n.featuredImage,
      images: n.images,
      variants: {
        edges: n.variants.edges.map(({ node: v }) => ({
          node: {
            id: v.id,
            availableForSale: v.availableForSale,
            price: { amount: String(v.price), currencyCode: 'USD' },
          },
        })),
      },
      // The site shows real counts; mirroring them keeps the "N left" pills
      // honest locally too.
      stock: n.variants.edges[0]?.node.inventoryQuantity ?? null,
    })),
  };
}

const out = {};
for (const handle of ['townies', 'the-good-kicks-v1']) {
  const { products, skipped } = await pull(handle);
  out[handle] = products;
  console.log(
    `${handle}: ${products.length} live product${products.length === 1 ? '' : 's'}` +
      (skipped ? ` (${skipped} not ACTIVE, skipped)` : ''),
  );
}

mkdirSync('.fixtures', { recursive: true });
writeFileSync('.fixtures/collections.json', JSON.stringify(out, null, 2));
console.log('→ .fixtures/collections.json');
