import type { CollectionProduct } from '@/lib/shopify/collections';
import { TOWNIES } from '@/lib/brand/brands';
import { christmasOrderBy, preorderShipNote } from '@/lib/townies/preorder';
import { stockTier } from '@/lib/townies/stock-tier';
import { hasCustomPage } from '@/lib/townies/custom-hats';

/**
 * Plain-text FAQ for a town page. Answers are strings on purpose: the same text
 * renders on the page and goes into FAQPage JSON-LD, so what Google reads is
 * exactly what the visitor reads (the /faq page puts the question text in the
 * schema answer, which is the thing to avoid).
 *
 * Every fact here comes from the shipping policy / size guide / live stock, so
 * when those change, this changes with them.
 */

export type Faq = { q: string; a: string };

const FREE_OVER = `$${(TOWNIES.freeShippingCents ?? 7500) / 100}`;

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'America/New_York' });
}

/** Lowercase first letter, for dropping a "Ships in…" note into a sentence. */
function lc(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export function townFaqs(
  townName: string,
  slug: string,
  products: CollectionProduct[],
  now = new Date(),
  /** Where the hat is "for" when that isn't its name (Titletown → Boston). */
  placeName = townName,
): Faq[] {
  // Same test as the product cards: tier 0 = really in stock, 1 = pre-order,
  // 2 = sold out (no shipping promise made for those).
  const inStock = products.filter((p) => stockTier(p) === 0);
  const preorder = products.filter((p) => stockTier(p) === 1);
  const one = products.length === 1;
  const it = one ? 'it' : 'they';
  const hat = one ? `The ${townName} hat` : `The ${townName} hats`;

  const faqs: Faq[] = [];

  faqs.push({
    q: `Is the ${townName} hat embroidered or printed?`,
    a: `Embroidered, not printed. The lettering and marks are raised stitching, so ${one ? 'it holds' : 'they hold'} up to years of wear. Designed in Massachusetts.`,
  });

  // Shipping: written from live stock state, not a blanket promise.
  let ship: string;
  if (inStock.length && !preorder.length) {
    ship = `${hat} ${one ? 'is' : 'are'} in stock and leave${one ? 's' : ''} our hands in 1 to 3 business days. Most orders arrive 3 to 7 business days after that, anywhere in the US.`;
  } else if (!inStock.length && preorder.length) {
    const note = preorderShipNote(preorder[0].tags).replace(/(\d)–(\d)/, '$1 to $2');
    ship = `${hat} ${one ? 'is' : 'are'} on pre-order right now, embroidered to order. ${one ? 'It' : 'They'} ${one ? lc(note) : lc(note).replace(/^ships/, 'ship')} from the day you order, and you get a tracking email the moment ${it} go${one ? 'es' : ''} out.`;
  } else if (!inStock.length && !preorder.length) {
    ship = `${hat} ${one ? 'is' : 'are'} sold out right now. In-stock hats leave our hands in 1 to 3 business days and pre-orders take 2 to 4 weeks, so check back soon.`;
  } else {
    ship = `Some ${townName} hats are in stock and ship in 1 to 3 business days; others are on pre-order and take 2 to 4 weeks. Each hat's page shows its own time.`;
  }
  const xmasProduct = inStock[0] ?? preorder[0];
  const xmas = xmasProduct ? christmasOrderBy(!inStock.length, xmasProduct.tags, now) : null;
  if (xmas) ship += ` To have it by Christmas, order by ${fmtDate(xmas)}.`;
  ship += ` Shipping is free on orders over ${FREE_OVER}.`;
  faqs.push({ q: `How fast does it ship to ${placeName}?`, a: ship });

  faqs.push({
    q: 'How does it fit?',
    a: 'One size fits most. It is an adjustable snapback that fits about 55 to 60cm (21.5 to 23.5 inches) of head circumference. If a snapback has fit you before, this will too.',
  });

  faqs.push({
    q: `Is it a good gift for someone from ${placeName}?`,
    a: `It is one of the most common reasons people buy one. A lot of our hats ship to people who grew up in a town and live somewhere else now. We ship anywhere in the US.`,
  });

  if (hasCustomPage(slug)) {
    faqs.push({
      q: `Can a business or team in ${townName} order custom hats?`,
      a: `Yes. We make custom embroidered hats with your own logo for ${townName} businesses, teams and events, and shops can carry the ${townName} town hat at a wholesale price.`,
    });
  }

  return faqs;
}
