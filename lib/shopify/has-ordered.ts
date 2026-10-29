import 'server-only';
import { shopifyAdminGraphQL } from './admin-graphql';

/**
 * Has this email placed an order before? Gate for first-order offers. Reads
 * the Shopify customer by email; a guest checkout still creates one. Returns
 * false when the lookup fails, so a Shopify hiccup costs at most one $5 code
 * rather than turning away a new customer.
 */
export async function hasOrderedBefore(email: string): Promise<boolean> {
  try {
    const data = await shopifyAdminGraphQL<{
      customers: { nodes: { email: string | null; numberOfOrders: string }[] };
    }>(
      `query($q: String!) { customers(first: 5, query: $q) { nodes { email numberOfOrders } } }`,
      { q: `email:"${email.replace(/"/g, '')}"` },
    );
    return data.customers.nodes.some(
      (c) => c.email?.toLowerCase() === email && Number(c.numberOfOrders) > 0,
    );
  } catch (err) {
    console.error('[has-ordered] lookup failed:', err);
    return false;
  }
}
