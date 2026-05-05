import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/shopify/service';

export async function GET() {
  const products = await getAllProducts();
  return NextResponse.json(products.map((p: { title: string; handle: string; tags: string[]; featuredImage?: { url: string } }) => ({
    title: p.title,
    handle: p.handle,
    tags: p.tags,
    image: p.featuredImage?.url ?? null,
  })));
}
