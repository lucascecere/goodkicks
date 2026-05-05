import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductByHandle } from '@/lib/shopify/service';
import { imageForVariant } from '@/lib/shopify/variant-colors';
import { ProductGallery } from './product-gallery';
import { ProductDetail } from './product-detail';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ handle: string }> };

function stateName(title: string) {
  return title.replace(/^The Good Kick\s*[—–-]\s*/i, '').toLowerCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return { title: 'Product Not Found' };
  const name = stateName(product.title);
  return {
    title: `${name} — good kicks foot bag`,
    description: `Hand-stitched foot bag in the ${name} colorway. $18. Free shipping on orders $35+.`,
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
    description: 'Hand-stitched foot bag — what everyone calls a hacky sack — built for dorm circles, campus quads, and every backpack that needs one.',
    descriptionHtml: '<p>Hand-stitched foot bag — what everyone calls a hacky sack — built for dorm circles, campus quads, and every backpack that needs one.</p>',
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
    offers: {
      '@type': 'Offer',
      price: (priceInCents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/PreOrder',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ProductGallery images={product.images} productTitle={product.title} />
          <ProductDetail product={product} variants={product.variants} />
        </div>
      </div>
    </>
  );
}
