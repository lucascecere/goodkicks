import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { storefrontClient } from '@/lib/shopify/client';
import { PRODUCT_BY_HANDLE_QUERY, ALL_PRODUCT_HANDLES_QUERY } from '@/lib/shopify/queries';
import type { ShopifyProduct } from '@/lib/shopify/types';
import { ProductGallery } from './product-gallery';
import { ProductDetail } from './product-detail';
import { flattenEdges } from '@/lib/shopify/transforms';

type Props = { params: Promise<{ handle: string }> };

export async function generateStaticParams() {
  try {
    const { data } = await storefrontClient.request(ALL_PRODUCT_HANDLES_QUERY);
    const products = flattenEdges(data?.products ?? { edges: [] }) as Array<{ handle: string }>;
    return products.map((p) => ({ handle: p.handle }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  try {
    const { data } = await storefrontClient.request(PRODUCT_BY_HANDLE_QUERY, {
      variables: { handle },
    });
    const product = data?.product as ShopifyProduct | undefined;
    if (!product) return { title: 'Product Not Found' };

    return {
      title: product.seo.title ?? product.title,
      description: product.seo.description ?? product.description,
      openGraph: {
        title: product.title,
        description: product.description,
        images: product.featuredImage ? [{ url: product.featuredImage.url }] : [],
        type: 'website',
      },
    };
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;

  let product: ShopifyProduct | null = null;
  try {
    const { data } = await storefrontClient.request(PRODUCT_BY_HANDLE_QUERY, {
      variables: { handle },
    });
    product = (data?.product as ShopifyProduct) ?? null;
  } catch {
    notFound();
  }

  if (!product) notFound();

  const images = product.images.edges.map(({ node }) => node);
  const variants = product.variants.edges.map(({ node }) => node);

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.featuredImage?.url,
    offers: {
      '@type': 'Offer',
      price: product.priceRange.minVariantPrice.amount,
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      availability: variants.some((v) => v.availableForSale)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ProductGallery images={images} productTitle={product.title} />
          <ProductDetail product={product} variants={variants} />
        </div>
      </div>
    </>
  );
}
