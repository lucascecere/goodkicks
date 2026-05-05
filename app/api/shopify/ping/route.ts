import { NextResponse } from 'next/server';
import { storefrontClient } from '@/lib/shopify/client';

const PRODUCTS_QUERY = `
  query {
    products(first: 10) {
      edges {
        node {
          title
          handle
          variants(first: 10) {
            edges {
              node { title }
            }
          }
        }
      }
    }
  }
`;

export async function GET() {
  const { data, errors } = await storefrontClient.request(PRODUCTS_QUERY);
  return NextResponse.json({ data, errors });
}
