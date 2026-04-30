export type ProductVariant = {
  id: string;
  name: string;
  priceInCents: number;
  quantity: number;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  images: Array<{ url: string; altText: string | null; width: number; height: number }>;
  variants: ProductVariant[];
};

export const GOOD_KICKS_FOOT_BAG: Product = {
  id: 'good-kicks-foot-bag',
  handle: 'good-kicks-foot-bag',
  title: 'Good Kicks Foot Bag',
  description: 'Hand-stitched foot bag — what everyone calls a hacky sack — built for dorm circles, campus quads, and every backpack that needs one.',
  descriptionHtml: '<p>Hand-stitched foot bag — what everyone calls a hacky sack — built for dorm circles, campus quads, and every backpack that needs one.</p>',
  images: [],
  variants: [
    { id: 'gk-1pack', name: '1-Pack', priceInCents: 1500, quantity: 1 },
    { id: 'gk-3pack', name: '3-Pack', priceInCents: 4000, quantity: 3 },
    { id: 'gk-5pack', name: '5-Pack', priceInCents: 6000, quantity: 5 },
  ],
};

export const ALL_PRODUCTS: Product[] = [GOOD_KICKS_FOOT_BAG];

export function getProductByHandle(handle: string): Product | null {
  return ALL_PRODUCTS.find((p) => p.handle === handle) ?? null;
}

export function getVariantById(variantId: string): { product: Product; variant: ProductVariant } | null {
  for (const product of ALL_PRODUCTS) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}
