import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductByHandle, getAllProducts } from '@/lib/shopify/service';
import { imageForVariant } from '@/lib/shopify/variant-colors';
import { ProductGallery } from './product-gallery';
import { ProductDetail } from './product-detail';
import { BundlePicker, type ColorwayProduct } from '@/components/product/bundle-picker';

export const revalidate = 3600;

const BUNDLE_HANDLES = ['3-pack'];

type Props = { params: Promise<{ handle: string }> };

function stateName(title: string) {
  return title.replace(/^The Good Kick\s*[—–-]\s*/i, '').toLowerCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return { title: 'Product Not Found' };
  if (BUNDLE_HANDLES.includes(handle)) {
    return {
      title: 'The 3-Pack — Build Your Own | Good Kicks',
      description: 'Pick any 3 foot bag colorways. Mix, match, or triple up. $24.99 — save $5 vs buying individually. $4 shipping, free on orders $35+.',
      alternates: { canonical: `/products/${handle}` },
      openGraph: {
        title: 'The 3-Pack — Build Your Own | Good Kicks',
        description: 'Pick any 3 colorways. $24.99 — save $5 vs buying individually.',
        url: `/products/${handle}`,
        images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'The 3-Pack — Build Your Own | Good Kicks',
        description: 'Pick any 3 colorways. $24.99 — save $5 vs buying individually.',
        images: ['/opengraph-image.png'],
      },
    };
  }
  const name = stateName(product.title);
  const imgUrl = product.featuredImage?.url;
  const canonical = `/products/${handle}`;
  return {
    title: `${name} — good kicks foot bag`,
    description: `Premium foot bag in the ${name} colorway. Built for dorm circles, campus quads, and every backpack that needs one.`,
    alternates: { canonical },
    openGraph: {
      title: `The Good Kick — ${name}`,
      description: `Premium foot bag in the ${name} colorway. Built for circles, campus quads, and every backpack that needs one.`,
      url: canonical,
      images: imgUrl
        ? [{ url: imgUrl, width: 800, height: 800, alt: `Good Kicks foot bag — ${name}` }]
        : [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: imgUrl ? [imgUrl] : ['/opengraph-image.png'],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const shopifyProduct = await getProductByHandle(handle);
  if (!shopifyProduct) notFound();

  const variant = shopifyProduct.variants.edges[0]?.node;
  if (!variant) notFound();

  const priceInCents = Math.round(parseFloat(variant.price.amount) * 100);
  const imgSrc = shopifyProduct.featuredImage?.url ?? imageForVariant(shopifyProduct.title);

  // Bundle page
  if (BUNDLE_HANDLES.includes(handle)) {
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
      <div className="bg-brand-cream min-h-screen">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10 sm:py-16">

          {/* Page header — always at top */}
          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest text-brand-muted font-medium mb-2">build your own bundle</p>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h1 className="font-display text-4xl sm:text-5xl text-brand-ink">the 3-pack.</h1>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-medium text-brand-ink">$24.99</span>
                <span className="text-brand-muted line-through text-base">$29.97</span>
              </div>
            </div>
          </div>

          {/* Two-column on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">

            {/* Left: image + details (desktop only) */}
            <div className="hidden lg:flex flex-col gap-6">
              <div className="rounded-2xl overflow-hidden bg-[#F5EFE3] aspect-square relative">
                <img
                  src="/products/all-sacks.jpg"
                  alt="The 3-Pack — all Good Kicks colorways"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="border border-brand-rule rounded-xl p-5 space-y-2">
                <p className="text-sm font-medium text-brand-ink">what you get</p>
                <ul className="space-y-1.5 text-sm text-brand-muted">
                  <li>3 × Good Kicks premium foot bags</li>
                  <li>your choice of colorways — duplicates welcome</li>
                  <li>$4 shipping — free on orders $35+</li>
                  <li>ships in 1–2 weeks</li>
                </ul>
              </div>
            </div>

            {/* Right: picker (full width on mobile) */}
            <BundlePicker
              bundleVariantId={variant.id}
              priceInCents={priceInCents}
              bundleImageUrl={imgSrc ?? null}
              colorways={colorways}
              packSize={3}
            />
          </div>

          {/* Mobile-only: details after picker */}
          <div className="lg:hidden mt-8 border border-brand-rule rounded-xl p-5 space-y-2">
            <p className="text-sm font-medium text-brand-ink">what you get</p>
            <ul className="space-y-1.5 text-sm text-brand-muted">
              <li>3 × Good Kicks premium foot bags</li>
              <li>your choice of colorways — duplicates welcome</li>
              <li>free shipping on orders $35+</li>
              <li>ships in 1–2 weeks</li>
            </ul>
          </div>

        </div>
      </div>
    );
  }

  // Standard single product page
  const name = stateName(shopifyProduct.title);

  const product = {
    id: shopifyProduct.id,
    handle: shopifyProduct.handle,
    title: name,
    description: 'Premium foot bag — what everyone calls a hacky sack — built for dorm circles, campus quads, and every backpack that needs one.',
    descriptionHtml: '<p>Premium foot bag — what everyone calls a hacky sack — built for dorm circles, campus quads, and every backpack that needs one.</p>',
    images: imgSrc
      ? [{ url: imgSrc, altText: shopifyProduct.featuredImage?.altText ?? `Good Kicks ${shopifyProduct.title}`, width: 800, height: 800 }]
      : [],
    variants: [{ id: variant.id, name, priceInCents, quantity: 99, color: undefined }],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    url: `https://goodkicks.co/products/${shopifyProduct.handle}`,
    image: imgSrc ?? undefined,
    brand: { '@type': 'Brand', name: 'Good Kicks' },
    offers: {
      '@type': 'Offer',
      url: `https://goodkicks.co/products/${shopifyProduct.handle}`,
      price: (priceInCents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Good Kicks' },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ProductGallery images={product.images} productTitle={product.title} />
          <ProductDetail product={product} variants={product.variants} />
        </div>
      </div>
    </>
  );
}
