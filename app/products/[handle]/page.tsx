import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductByHandle, ALL_PRODUCTS } from '@/lib/products/catalog';
import { ProductGallery } from './product-gallery';
import { ProductDetail } from './product-detail';

type Props = { params: Promise<{ handle: string }> };

export function generateStaticParams() {
  return ALL_PRODUCTS.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = getProductByHandle(handle);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: product.title,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: product.images[0] ? [{ url: product.images[0].url }] : [],
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = getProductByHandle(handle);
  if (!product) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: (product.variants[0].priceInCents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
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
