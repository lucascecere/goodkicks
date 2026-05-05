export const IMAGE_FRAGMENT = `
  fragment ImageFragment on Image {
    url
    altText
    width
    height
  }
`;

export const MONEY_FRAGMENT = `
  fragment MoneyFragment on MoneyV2 {
    amount
    currencyCode
  }
`;

export const PRODUCT_VARIANT_FRAGMENT = `
  fragment ProductVariantFragment on ProductVariant {
    id
    title
    availableForSale
    selectedOptions {
      name
      value
    }
    price {
      ...MoneyFragment
    }
    compareAtPrice {
      ...MoneyFragment
    }
    image {
      ...ImageFragment
    }
  }
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
`;

export const CART_FRAGMENT = `
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      totalAmount {
        ...MoneyFragment
      }
      subtotalAmount {
        ...MoneyFragment
      }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount {
              ...MoneyFragment
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              selectedOptions {
                name
                value
              }
              price {
                ...MoneyFragment
              }
              product {
                title
                handle
                featuredImage {
                  ...ImageFragment
                }
              }
            }
          }
        }
      }
    }
  }
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
`;
