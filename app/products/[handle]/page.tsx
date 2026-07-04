import type { Metadata } from 'next';
import { ProductPageBody, productPageMetadata } from '@/components/product/product-page';

export const revalidate = 3600;

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  return productPageMetadata(handle); // auto-detect brand (Townies default)
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  return <ProductPageBody handle={handle} />;
}
