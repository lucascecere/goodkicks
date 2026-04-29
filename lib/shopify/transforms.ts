import type { ShopifyMoneyV2, ShopifyCart, CartItem, ShopifyCartLine } from './types';

export function formatPrice(money: ShopifyMoneyV2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(parseFloat(money.amount));
}

export function flattenEdges<T>(connection: { edges: Array<{ node: T }> }): T[] {
  return connection.edges.map(({ node }) => node);
}

function flattenCartLine(line: ShopifyCartLine): CartItem {
  return {
    lineId: line.id,
    variantId: line.merchandise.id,
    quantity: line.quantity,
    title: line.merchandise.product.title,
    variantTitle: line.merchandise.title,
    handle: line.merchandise.product.handle,
    image: line.merchandise.product.featuredImage,
    price: line.merchandise.price,
    lineTotal: line.cost.totalAmount,
  };
}

export function flattenCartLines(cart: ShopifyCart): CartItem[] {
  return cart.lines.edges.map(({ node }) => flattenCartLine(node));
}
