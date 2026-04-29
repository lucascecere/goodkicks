import { PRODUCT_VARIANT_FRAGMENT, CART_FRAGMENT, IMAGE_FRAGMENT } from './fragments';

export const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      tags
      seo {
        title
        description
      }
      featuredImage {
        ...ImageFragment
      }
      images(first: 20) {
        edges {
          node {
            ...ImageFragment
          }
        }
      }
      variants(first: 10) {
        edges {
          node {
            ...ProductVariantFragment
          }
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
  ${PRODUCT_VARIANT_FRAGMENT}
`;

export const ALL_PRODUCT_HANDLES_QUERY = `
  query AllProductHandles {
    products(first: 250) {
      edges {
        node {
          handle
        }
      }
    }
  }
`;

export const CART_QUERY = `
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      ...CartFragment
    }
  }
  ${CART_FRAGMENT}
`;
