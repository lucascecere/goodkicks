export interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface ShopifyMoneyV2 {
  amount: string;
  currencyCode: string;
}

export interface ShopifySelectedOption {
  name: string;
  value: string;
}

export interface ShopifyProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoneyV2;
  compareAtPrice: ShopifyMoneyV2 | null;
  selectedOptions: ShopifySelectedOption[];
  image: ShopifyImage | null;
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  featuredImage: ShopifyImage | null;
  images: { edges: Array<{ node: ShopifyImage }> };
  variants: { edges: Array<{ node: ShopifyProductVariant }> };
  priceRange: { minVariantPrice: ShopifyMoneyV2 };
  tags: string[];
  seo: { title: string | null; description: string | null };
}

export interface ShopifyCartLineMerchandise {
  id: string;
  title: string;
  selectedOptions: ShopifySelectedOption[];
  price: ShopifyMoneyV2;
  product: {
    title: string;
    handle: string;
    featuredImage: ShopifyImage | null;
  };
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  cost: { totalAmount: ShopifyMoneyV2 };
  merchandise: ShopifyCartLineMerchandise;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    totalAmount: ShopifyMoneyV2;
    subtotalAmount: ShopifyMoneyV2;
  };
  lines: { edges: Array<{ node: ShopifyCartLine }> };
}

// Flattened cart item for UI
export interface CartItem {
  lineId: string;
  variantId: string;
  quantity: number;
  title: string;
  variantTitle: string;
  handle: string;
  image: ShopifyImage | null;
  price: ShopifyMoneyV2;
  lineTotal: ShopifyMoneyV2;
}
