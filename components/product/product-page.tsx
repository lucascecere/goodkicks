import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getProductByHandle, getAllProducts } from '@/lib/shopify/service';
import { getTownieProducts, getGoodKicksProducts, type CollectionProduct } from '@/lib/shopify/collections';
import { breadcrumbSchema } from '@/lib/seo/site';
import { toTownView } from '@/lib/townies/towns';
import { imageForVariant } from '@/lib/shopify/variant-colors';
import { BrandImage } from '@/components/ui/brand-image';
import { TowniesBlock } from '@/components/brand/wordmark';
import { TownCard } from '@/components/townies/town-card';
import { BuyBox, type BuyVariant } from '@/components/townies/buy-box';
import { ValueBand } from '@/components/townies/value-band';
import { BundlePicker, type ColorwayProduct } from '@/components/product/bundle-picker';
import { ProductMedia, type ProductMediaImage } from '@/components/product/product-media';
import { isPreorder, PREORDER_SHIP_NOTE } from '@/lib/townies/preorder';

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
  if (gk) return title.replace(/^The Good Kick\s*[—–-]\s*/i, '').replace(/^The\s+/i, '');
  return title;
}

/** true if this product should render as Good Kicks. */
function resolveGk(handle: string, title: string, brand?: Brand): boolean {
  if (brand === 'goodkicks') return true;
  if (brand === 'townies') return false;
  return detectGoodKicks(handle, title);
}

function priceLabel(p: CollectionProduct): string {
  const amount = p.variants.edges[0]?.node.price.amount;
  return amount ? `$${parseFloat(amount).toFixed(2)}` : '';
}

export async function productPageMetadata(handle: string, brand?: Brand): Promise<Metadata> {
  const product = await getProductByHandle(handle);
  if (!product) return { title: 'Product Not Found' };
  const gk = resolveGk(handle, product.title, brand);
  const name = displayName(handle, product.title, gk);
  const label = gk ? 'Good Kicks' : 'Townies';
  const imgUrl = product.featuredImage?.url;
  const canonical = gk ? `/goodkicks/products/${handle}` : `/products/${handle}`;
  // Prefer the Shopify SEO metafields (global.title_tag / description_tag, exposed
  // as product.seo) when set; fall back to the generic template otherwise.
  const seoTitle = product.seo?.title?.trim() || `${name} — ${label}`;
  const seoDescription =
    product.seo?.description?.trim() ||
    (gk
      ? `${name} — a premium Good Kicks foot bag. Properly weighted, built to last.`
      : `${name}, Massachusetts. Town-pride apparel — the town is the hero, Townies is the label.`);
  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonical,
      images: imgUrl
        ? [{ url: imgUrl, width: 1000, height: 1000, alt: `${name} — ${label}` }]
        : [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    },
  };
}

export async function ProductPageBody({ handle, brand }: { handle: string; brand?: Brand }) {
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
            <h1 className="font-heading text-4xl sm:text-5xl text-text">the 3-pack.</h1>
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

  // Cross-sell within the same brand.
  const townCross = gk ? [] : (await getTownieProducts()).filter((p) => p.handle !== handle).slice(0, 4).map(toTownView);
  const gkCross = gk ? (await getGoodKicksProducts()).filter((p) => p.handle !== handle).slice(0, 4) : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    url: `${productBase}/${handle}`,
    image: imgSrc ?? undefined,
    description: gk
      ? `${name} — a hand-stitched Good Kicks foot bag, properly weighted and built to take a beating.`
      : `${name} — heavyweight Massachusetts town-pride apparel from Townies. Stitched, not printed, and built to last.`,
    brand: { '@type': 'Brand', name: gk ? 'Good Kicks' : 'Townies' },
    offers: {
      '@type': 'Offer',
      price: (variants[0].priceInCents / 100).toFixed(2),
      priceCurrency: 'USD',
      url: `${productBase}/${handle}`,
      itemCondition: 'https://schema.org/NewCondition',
      availability: preorder
        ? 'https://schema.org/PreOrder'
        : variants.some((v) => v.available)
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
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
        { name: 'Towns', path: '/shop' },
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
                alt={`${name} — ${gk ? 'Good Kicks' : 'Townies'}`}
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
                Good Kicks
              </span>
            ) : (
              <TowniesBlock className="block text-[0.65rem] mb-1" />
            )}
            <h1 className="font-heading uppercase leading-[0.9] tracking-[0.01em] text-text text-3xl sm:text-5xl lg:text-7xl mb-3 break-words">
              {name}
            </h1>
            {gk ? (
              <p className="text-muted leading-relaxed mb-8 max-w-md">
                A hand-stitched Good Kicks foot bag — properly weighted, built to take a beating, made to keep the circle going. Pick your colorway.
              </p>
            ) : shopifyProduct.descriptionHtml ? (
              <div
                className="text-muted leading-relaxed mb-8 max-w-md space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mt-1 [&_p]:leading-relaxed [&_strong]:text-text [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: shopifyProduct.descriptionHtml }}
              />
            ) : (
              <p className="text-muted leading-relaxed mb-8 max-w-md">
                Rep your town before anyone has to ask where you’re from. Wear it ’til it’s got a story.
              </p>
            )}

            <BuyBox
              variants={variants}
              productTitle={name}
              imageUrl={imgSrc}
              flavor={gk ? 'goodkicks' : 'townies'}
              preorder={preorder}
              shipNote={PREORDER_SHIP_NOTE}
            />
            {!gk && (
              <p className="mt-4 text-xs text-muted">
                One size fits most, adjustable snapback —{' '}
                <Link
                  href="/size-guide"
                  className="underline underline-offset-2 hover:text-text transition-colors"
                >
                  size guide
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Cross-sell — Townies towns */}
        {townCross.length > 0 && (
          <div className="mt-20 sm:mt-28">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-heading uppercase text-2xl sm:text-3xl text-text whitespace-nowrap">More towns</h2>
              <div className="h-px flex-1 bg-rule" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {townCross.map((town) => (
                <TownCard key={town.id} town={town} />
              ))}
            </div>
          </div>
        )}

        {/* Cross-sell — Good Kicks colorways */}
        {gkCross.length > 0 && (
          <div className="mt-20 sm:mt-28">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-heading text-2xl sm:text-3xl text-text whitespace-nowrap">more colorways</h2>
              <div className="h-px flex-1 bg-rule" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {gkCross.map((p) => (
                <Link key={p.id} href={`${productBase}/${p.handle}`} className="group block">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-surface border border-rule">
                    {p.featuredImage?.url ? (
                      <Image
                        src={p.featuredImage.url}
                        alt={p.featuredImage.altText ?? p.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-rule" />
                    )}
                  </div>
                  <div className="pt-3">
                    <p className="font-medium text-text text-sm group-hover:text-accent transition-colors">{p.title}</p>
                    <p className="text-muted text-sm mt-0.5">{priceLabel(p)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Townies only — the band is written in Townies' voice and marks, and
          this component also renders Good Kicks product pages. */}
      {!gk && <ValueBand />}
    </div>
  );
}
