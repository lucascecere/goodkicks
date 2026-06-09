export type ProductVariant = {
  id: string;
  name: string;
  priceInCents: number;
  quantity: number;
  color?: string;
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
  description: 'Premium foot bag — what everyone calls a hacky sack — built for dorm circles, campus quads, and every backpack that needs one.',
  descriptionHtml: '<p>Premium foot bag — what everyone calls a hacky sack — built for dorm circles, campus quads, and every backpack that needs one.</p>',
  images: [
    { url: '/brand/Photoroom_20260504_182143.jpeg', altText: 'Good Kicks Foot Bag — Georgia colorway', width: 1512, height: 2016 },
  ],
  variants: [
    { id: 'gk-tennessee',  name: 'tennessee',  priceInCents: 1500, quantity: 1, color: '#C15A3A' },
    { id: 'gk-maine',      name: 'maine',      priceInCents: 1500, quantity: 1, color: '#5A5E68' },
    { id: 'gk-montana',    name: 'montana',    priceInCents: 1500, quantity: 1, color: '#5BA4B4' },
    { id: 'gk-new-york',   name: 'new york',   priceInCents: 1500, quantity: 1, color: '#A89870' },
    { id: 'gk-new-mexico', name: 'new mexico', priceInCents: 1500, quantity: 1, color: '#D4A84B' },
    { id: 'gk-massachusetts', name: 'massachusetts', priceInCents: 1500, quantity: 1, color: '#4A4848' },
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
