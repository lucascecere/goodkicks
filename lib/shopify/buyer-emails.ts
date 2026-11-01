import 'server-only';
import { shopifyAdminGraphQL } from './admin-graphql';

/**
 * Every email Shopify has an order against, lower-cased. The contacts table's
 * `order` source misses some buyers (orders from before the webhook), so a
 * "people who haven't bought" send checks this as well. Throws on failure:
 * a send that can't tell buyers apart must not go out.
 */
export async function shopifyBuyerEmails(): Promise<Set<string>> {
  const emails = new Set<string>();
  let after: string | null = null;
  for (let page = 0; page < 40; page++) {
    const data: {
      customers: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: { email: string | null; numberOfOrders: string }[];
      };
    } = await shopifyAdminGraphQL(
      `query($after: String) {
        customers(first: 250, after: $after, query: "orders_count:>0") {
          pageInfo { hasNextPage endCursor }
          nodes { email numberOfOrders }
        }
      }`,
      { after },
    );
    for (const c of data.customers.nodes) {
      if (c.email && Number(c.numberOfOrders) > 0) emails.add(c.email.trim().toLowerCase());
    }
    if (!data.customers.pageInfo.hasNextPage) return emails;
    after = data.customers.pageInfo.endCursor;
  }
  throw new Error('Too many Shopify customers to page through.');
}
