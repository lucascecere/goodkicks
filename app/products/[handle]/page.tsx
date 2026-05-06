import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductByHandle } from '@/lib/shopify/service';
import { imageForVariant } from '@/lib/shopify/variant-colors';
import { ProductGallery } from './product-gallery';
import { ProductDetail } from './product-detail';

export const revalidate = 3600;

type Props = { params: Promise<{ handle: string }> };

function stateName(title: string) {
  return title.replace(/^The Good Kick\s*[—–-]\s*/i, '').toLowerCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return { title: 'Product Not Found' };
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
      availability: 'https://schema.org/PreOrder',
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
