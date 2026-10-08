import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getProductByHandle, getAllProducts } from '@/lib/shopify/service';
import { getTownieProducts, getGoodKicksProducts, type CollectionProduct } from '@/lib/shopify/collections';
import { breadcrumbSchema } from '@/lib/seo/site';
import { townHref, townKey } from '@/lib/townies/towns';
import { customTownHref, hasCustomPage } from '@/lib/townies/custom-hats';
import { imageForVariant } from '@/lib/shopify/variant-colors';
import { BrandImage } from '@/components/ui/brand-image';
import { TowniesBlock } from '@/components/brand/wordmark';
import { ProductCard } from '@/components/townies/product-card';
import { TrustRow } from '@/components/townies/trust-row';
import { gkDisplayName, gkDescriptionHtml, gkLine } from '@/lib/goodkicks/names';
import { BuyBox, type BuyVariant } from '@/components/townies/buy-box';
import { BundlePicker, type ColorwayProduct } from '@/components/product/bundle-picker';
import { ProductMedia, type ProductMediaImage } from '@/components/product/product-media';
import { isPreorder, PREORDER_SHIP_NOTE } from '@/lib/townies/preorder';
import { getVariantStock, stockNote } from '@/lib/shopify/stock';
import { gkCanonical, SITE_URL } from '@/lib/seo/site';
import {
  HAT_SACK_HANDLE,
  HAT_SACK_LIVE,
  HAT_SACK_PATH,
  HAT_SACK_PRICE_FALLBACK_CENTS,
  formatUsd,
} from '@/lib/townies/hat-sack';
import { getHatSackOffer } from '@/lib/shopify/hat-sack-offer';
import { getProductReviews } from '@/lib/reviews/server';
import { ProductReviews } from '@/components/townies/v2/product-reviews';
import { Stars } from '@/components/townies/v2/stars';

// Shared product-detail body, rendered by BOTH the Townies route
// (app/products/[handle]) and the Good Kicks route (app/goodkicks/products/[handle]).
// Pass `brand` to force identity; omit it on the Townies route to auto-detect GK
// products by handle/title (back-compat). Structural styling uses SEMANTIC tokens
// so the page themes itself from whichever [data-brand] scope it renders under.

export const BUNDLE_HANDLES = ['3-pack'];

type Brand = 'townies' | 'goodkicks';

type ShopifyVariantNode = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: { amount: string };
};

function detectGoodKicks(handle: string, title: string): boolean {
  const h = handle.toLowerCase();
  const t = title.toLowerCase();
  return BUNDLE_HANDLES.includes(h) || h.startsWith('the-good-kick') || t.includes('good kick');
}

function displayName(handle: string, title: string, gk: boolean): string {
  return gk ? gkDisplayName(title) : title;
}

/** true if this product should render as Good Kicks. */
function resolveGk(handle: string, title: string, brand?: Brand): boolean {
  if (brand === 'goodkicks') return true;
  if (brand === 'townies') return false;
  return detectGoodKicks(handle, title);
}

export async function productPageMetadata(handle: string, brand?: Brand): Promise<Metadata> {
  const product = await getProductByHandle(handle);
  if (!product) return { title: 'Product Not Found' };
  const gk = resolveGk(handle, product.title, brand);
  const name = displayName(handle, product.title, gk);
  const label = gk ? 'Good Kicks' : 'Townies';
  const imgUrl = product.featuredImage?.url;
  // A Good Kicks product canonicalises to Good Kicks' own domain once that
  // domain is live; until then to its working /goodkicks path. Both brands'
  // products are readable at /products/<handle>, so this is the tag that stops
  // one product ranking as two pages.
  const canonical = gk ? gkCanonical(`products/${handle}`) : `/products/${handle}`;
  // Prefer the Shopify SEO metafields (global.title_tag / description_tag, exposed
  // as product.seo) when set; fall back to the generic template otherwise.
  // The layout template appends the brand ("| Townies" / "| Good Kicks"), and
  // several Shopify SEO titles already end in "| Townies" — strip it so the tab
  // doesn't read "… | Townies | Townies".
  const seoTitle =
    product.seo?.title?.trim().replace(/\s*[|—–-]\s*(Townies|Good Kicks)\s*$/i, '') || name;
  const seoDescription =
    product.seo?.description?.trim() ||
    (gk
      ? `${name} — a premium Good Kicks foot bag. Properly weighted, built to last.`
      : `${name}, an embroidered snapback from Townies Apparel Co. The town is the hero, Townies is the label.`);
  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonical,
      images: imgUrl
        ? [{ url: imgUrl, width: 1000, height: 1000, alt: gk ? `${name} — ${label}` : `${name} by ${label}` }]
        : [{ url: '/opengraph-image.jpg', width: 1200, height: 630 }],
    },
  };
}

export async function ProductPageBody({ handle, brand }: { handle: string; brand?: Brand }) {
  // The bundle is a real Shopify product, so its handle resolves here — but it
  // is unsellable through the standard buy box (the town has to be chosen, and
  // that choice decides which variant the line lands on). Send it to its picker.
  if (handle === HAT_SACK_HANDLE) {
    if (!HAT_SACK_LIVE) notFound();
    redirect(HAT_SACK_PATH);
  }

  const shopifyProduct = await getProductByHandle(handle);
  if (!shopifyProduct) notFound();

  const firstVariant = shopifyProduct.variants.edges[0]?.node as ShopifyVariantNode | undefined;
  if (!firstVariant) notFound();

  const gk = resolveGk(handle, shopifyProduct.title, brand);
  const name = displayName(handle, shopifyProduct.title, gk);
  // Pre-order is a Townies mechanic. Good Kicks ships from stock, so ignore any
  // stale `preorder` tags on GK products — its PDPs must never promise a delay.
  const preorder = !gk && isPreorder(shopifyProduct.tags);
  const imgSrc =
    shopifyProduct.featuredImage?.url ?? (gk ? imageForVariant(shopifyProduct.title) : undefined);
  const productBase = gk ? '/goodkicks/products' : '/products';

  // Every image on the product, featured first. Shopify already returns them in
  // position order, but featuredImage is the merchandiser's explicit pick, so it
  // leads and is de-duped out of the rest.
  const galleryImages: ProductMediaImage[] = (
    (shopifyProduct.images?.edges ?? []) as Array<{ node: ProductMediaImage }>
  ).map((e) => e.node);
  const orderedImages: ProductMediaImage[] = shopifyProduct.featuredImage
    ? [
        shopifyProduct.featuredImage as ProductMediaImage,
        ...galleryImages.filter((i) => i.url !== shopifyProduct.featuredImage.url),
      ]
    : galleryImages;

  // ── Good Kicks build-your-own bundle ────────────────────────────────────────
  if (BUNDLE_HANDLES.includes(handle)) {
    const priceInCents = Math.round(parseFloat(firstVariant.price.amount) * 100);
    const allProducts = await getAllProducts();
    const colorways: ColorwayProduct[] = allProducts
      .filter((p: { handle: string }) => !BUNDLE_HANDLES.includes(p.handle))
      .map((p: { id: string; title: string; handle: string; featuredImage?: { url: string }; variants: { edges: Array<{ node: { availableForSale: boolean } }> } }) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        availableForSale: p.variants.edges[0]?.node.availableForSale ?? false,
        imageUrl: p.featuredImage?.url ?? imageForVariant(p.title) ?? null,
      }));

    return (
      <div className="bg-bg min-h-screen">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10 sm:py-16">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest text-muted font-medium mb-2">
              Build your own bundle
            </p>
            <h1 className="display text-4xl sm:text-5xl text-text">the 3-pack.</h1>
          </div>
          <BundlePicker
            bundleVariantId={firstVariant.id}
            priceInCents={priceInCents}
            bundleImageUrl={imgSrc ?? null}
            colorways={colorways}
            packSize={3}
          />
        </div>
      </div>
    );
  }

  // ── Standard product ────────────────────────────────────────────────────────
  const variants: BuyVariant[] = shopifyProduct.variants.edges.map((e: { node: ShopifyVariantNode }) => ({
    id: e.node.id,
    name: e.node.title === 'Default Title' ? name : e.node.title,
    priceInCents: Math.round(parseFloat(e.node.price.amount) * 100),
    available: e.node.availableForSale,
  }));

  // Real on-hand count for the first variant. Good Kicks is in stock as a
  // rule and ships from the shelf, so it says so whenever the variant is
  // buyable rather than waiting on a tracked count. Unknown → nothing shown.
  const stock = gk ? {} : await getVariantStock([firstVariant.id]);
  const stockLine = gk
    ? firstVariant.availableForSale ? 'In stock · ships in 1–3 business days' : null
    : stockNote(stock[firstVariant.id]?.quantity);

  // Cross-sell within the same brand.
  const hatSack = gk || !HAT_SACK_LIVE ? null : await getHatSackOffer();
  const townCross = gk ? [] : (await getTownieProducts()).filter((p) => p.handle !== handle).slice(0, 4);
  const gkCross = gk ? (await getGoodKicksProducts()).filter((p) => p.handle !== handle).slice(0, 4) : [];

  // Real approved reviews for this hat (Townies only).
  const reviews = gk ? [] : await getProductReviews(handle);
  const reviewAvg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  // Absolute, canonical URLs — Google's merchant-listing parser does not resolve
  // relative ones, and a GK product's real home is its own domain.
  const productUrl = gk ? gkCanonical(`products/${handle}`) : `${SITE_URL}/products/${handle}`;
  const schemaImages = orderedImages.length ? orderedImages.map((i) => i.url) : imgSrc ? [imgSrc] : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    url: productUrl,
    image: schemaImages,
    description: gk
      ? `${name} — a hand-stitched Good Kicks foot bag, properly weighted and built to take a beating.`
      : `${name}, a Massachusetts town hat from Townies Apparel Co. Embroidered, not printed.`,
    brand: { '@type': 'Brand', name: gk ? 'Good Kicks' : 'Townies' },
    // Only real, approved reviews; omitted entirely when there are none.
    ...(reviews.length
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: reviewAvg.toFixed(1),
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews.slice(0, 10).map((r) => ({
            '@type': 'Review',
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
            author: { '@type': 'Person', name: r.name },
            reviewBody: r.quote,
          })),
        }
      : {}),
    offers: {
      '@type': 'Offer',
      price: (variants[0].priceInCents / 100).toFixed(2),
      priceCurrency: 'USD',
      url: productUrl,
      itemCondition: 'https://schema.org/NewCondition',
      ...(gk ? {} : { seller: { '@id': `${SITE_URL}/#organization` } }),
      availability: preorder
        ? 'https://schema.org/PreOrder'
        : variants.some((v) => v.available)
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      ...(gk
        ? {}
        : {
            // Mirrors /returns-policy word for word: 30 days, by mail, the
            // customer covers return postage. Change both together.
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: 'US',
              returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
              merchantReturnDays: 30,
              returnMethod: 'https://schema.org/ReturnByMail',
              returnFees: 'https://schema.org/ReturnShippingFees',
            },
          }),
    },
  };

  const crumbs = gk
    ? [
        { name: 'Good Kicks', path: '/goodkicks' },
        { name: 'Shop', path: '/goodkicks/shop' },
        { name, path: `/goodkicks/products/${handle}` },
      ]
    : [
        { name: 'Home', path: '/' },
        { name: townKey(shopifyProduct).name, path: townHref(townKey(shopifyProduct).slug) },
        { name, path: `/products/${handle}` },
      ];

  return (
    <div className="bg-bg min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([jsonLd, breadcrumbSchema(crumbs)]).replace(/</g, '\\u003c'),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Gallery — thumbnails only when the product actually has more than one
              image. Single-image and image-less products keep the BrandImage slot so
              the branded placeholder fallback is preserved. */}
          {orderedImages.length > 1 ? (
            <ProductMedia images={orderedImages} productTitle={name} />
          ) : (
            <div className="relative aspect-square overflow-hidden rounded-sm">
              <BrandImage
                src={imgSrc}
                alt={`${name}, ${gk ? 'Good Kicks' : 'Townies'}`}
                tone={gk ? 'cream' : 'navy'}
                label={name}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          )}

          {/* Details */}
          <div className="lg:pt-6">
            {gk ? (
              <span className="block font-heading uppercase tracking-[0.15em] text-accent text-[0.65rem] mb-1">
                {gkLine(shopifyProduct.title)}
              </span>
            ) : (
              <TowniesBlock className="block text-[0.65rem] mb-1" />
            )}
            <h1 className={`display text-text break-words ${gk ? 'text-3xl sm:text-[2.75rem] lg:text-[3.25rem] mb-3' : 'text-[1.875rem] sm:text-[2.25rem] mb-2'}`}>
              {name}
            </h1>
            {!gk && reviews.length > 0 && (
              <a href="#reviews" className="mb-2 flex w-fit items-center gap-2 text-[0.875rem] text-text hover:underline underline-offset-4">
                <Stars value={reviewAvg} size={15} />
                <span className="font-semibold">{reviewAvg.toFixed(1)}</span>
                <span className="text-muted">({reviews.length})</span>
              </a>
            )}
            {!gk && (
              <Link
                href={townHref(townKey(shopifyProduct).slug)}
                className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-muted hover:text-text underline underline-offset-4 mb-5"
              >
                All {townKey(shopifyProduct).name}, MA hats
              </Link>
            )}
            {!gk && shopifyProduct.descriptionHtml ? (
              <TowniesDescription html={shopifyProduct.descriptionHtml} />
            ) : shopifyProduct.descriptionHtml ? (
              <div
                className="text-muted leading-relaxed mb-8 max-w-md space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mt-1 [&_p]:leading-relaxed [&_strong]:text-text [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: gk ? gkDescriptionHtml(shopifyProduct.descriptionHtml) : shopifyProduct.descriptionHtml }}
              />
            ) : gk ? (
              <p className="text-muted leading-relaxed mb-8 max-w-md">
                A hand-stitched Good Kicks foot bag — properly weighted, built to take a beating, made to keep the circle going. Pick your colorway.
              </p>
            ) : (
              <p className="text-muted leading-relaxed mb-8 max-w-md">
                Your town, stitched on the front. Wear it until it has a story.
              </p>
            )}

            <BuyBox
              variants={variants}
              productTitle={name}
              imageUrl={imgSrc}
              flavor={gk ? 'goodkicks' : 'townies'}
              preorder={preorder}
              shipNote={PREORDER_SHIP_NOTE}
              stockNote={stockLine}
            />
            {gk ? (
              <TrustRow
                items={['Free shipping, always', '30-day returns', 'Ships from Massachusetts']}
                href="/goodkicks/shipping-returns"
              />
            ) : (
              <TrustRow
                items={['Free shipping over $75', '30-day returns', 'Ships from the South Shore']}
                href="/shipping-policy"
              />
            )}
            {!gk && (
              <>
                <p className="mt-4 text-xs text-muted">
                  One size fits most, adjustable snapback.{' '}
                  <Link
                    href="/size-guide"
                    className="underline underline-offset-2 hover:text-text transition-colors"
                  >
                    size guide
                  </Link>
                </p>
                {/* Bundle upsell. A link, not a second buy button: the bundle is
                    a different line item at a different price, and two add-to-cart
                    controls in one buy box is how people buy the wrong one.
                    Suppressed on towns the bundle excludes — offering it there
                    sends people to a picker their town isn't in. */}
                {hatSack && !preorder && (stock[firstVariant.id]?.quantity ?? 0) > 0 && (
                <Link
                  href={HAT_SACK_PATH}
                  className="mt-5 flex items-center justify-between gap-4 rounded-sm border border-rule bg-surface px-4 py-3 transition-colors hover:border-accent"
                >
                  <span className="text-[0.8125rem] leading-snug text-text">
                    <span className="font-semibold">
                      Make it {formatUsd(hatSack?.priceCents ?? HAT_SACK_PRICE_FALLBACK_CENTS)}
                    </span>
                    <span className="text-muted">: add any Good Kicks foot bag, shipping included</span>
                  </span>
                  <span aria-hidden className="text-muted text-sm">
                    &rarr;
                  </span>
                </Link>
                )}
                {hasCustomPage(townKey(shopifyProduct).slug) && (
                  <p className="mt-5 text-xs text-muted">
                    Ordering for a business or team in {townKey(shopifyProduct).name}?{' '}
                    <Link
                      href={customTownHref(townKey(shopifyProduct).slug)}
                      className="underline underline-offset-2 hover:text-text transition-colors"
                    >
                      Custom hats for {townKey(shopifyProduct).name}
                    </Link>
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {!gk && <ProductReviews reviews={reviews} handle={handle} />}

        {/* Cross-sell — Townies towns */}
        {townCross.length > 0 && (
          <div className="mt-20 sm:mt-28">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="display text-2xl sm:text-3xl text-text whitespace-nowrap">More towns</h2>
              <div className="h-px flex-1 bg-rule" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {townCross.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Cross-sell — Good Kicks colorways */}
        {gkCross.length > 0 && (
          <div className="mt-20 sm:mt-28">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="display text-2xl sm:text-3xl text-text whitespace-nowrap">more colorways</h2>
              <div className="h-px flex-1 bg-rule" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {gkCross.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  productBase={productBase}
                  title={gkDisplayName(p.title)}
                  fit="cover"
                  flavor="goodkicks"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Townies only — the band is written in Townies' voice and marks. The
          Good Kicks page carries its own version on /goodkicks. */}
    </div>
  );
}


/**
 * Townies v2 PDP copy (2026-10): Lucas found the right column too wordy. Show
 * the first two sentences as a short lead and fold the full Shopify description
 * (story + spec bullets) into a closed "Details" toggle, Melin-style.
 */
function toText(html: string): string {
  return html
    .replace(/<li[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, '\u2019')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Split the description so nothing is said twice: the lead is the first two
 * sentences of the first paragraph, and the Details toggle gets everything
 * else (the rest of that paragraph, then the remaining HTML untouched).
 */
function splitDescription(html: string): { lead: string; rest: string } {
  const first = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const source = first ? toText(first[1]) : toText(html);
  const sentences = source.match(/[^.!?]+[.!?]+(\s|$)/g)?.map((x) => x.trim()) ?? [source];
  const lead = sentences.slice(0, 2).join(' ');
  if (!first) return { lead, rest: '' };
  const remainder = sentences.slice(2).join(' ');
  const rest = html.replace(first[0], remainder ? `<p>${escapeHtml(remainder)}</p>` : '').trim();
  return { lead, rest: toText(rest) ? rest : '' };
}

function TowniesDescription({ html }: { html: string }) {
  const { lead, rest } = splitDescription(html);
  return (
    <div className="mb-6 max-w-md">
      <p className="text-[0.9375rem] leading-relaxed text-muted">{lead}</p>
      {rest && (
      <details className="group mt-4 border-y border-rule">
        <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-label text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-text [&::-webkit-details-marker]:hidden">
          Details
          <span aria-hidden className="text-lg leading-none transition-transform group-open:rotate-45">+</span>
        </summary>
        <div
          className="pb-4 text-[0.875rem] text-muted leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-text [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: rest }}
        />
      </details>
      )}
    </div>
  );
}
