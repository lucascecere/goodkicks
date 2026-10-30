import 'server-only';
import { shopifyAdminGraphQL } from './admin-graphql';

/**
 * Put an email on the Shopify marketing list (a customer with email marketing
 * SUBSCRIBED), creating the customer if needed.
 *
 * Shopify Email sends drops and abandoned-checkout mail to this list. Pop-up
 * signups used to land only in Supabase `contacts`, so they never heard about
 * a new town even though the pop-up promised they would. Never throws.
 */
export async function subscribeShopifyCustomer(email: string): Promise<void> {
  const consent = {
    marketingState: 'SUBSCRIBED',
    marketingOptInLevel: 'SINGLE_OPT_IN',
    consentUpdatedAt: new Date().toISOString(),
  };
  try {
    const found = await shopifyAdminGraphQL<{ customers: { nodes: Array<{ id: string; emailMarketingConsent: { marketingState: string } | null }> } }>(
      'query($q: String!) { customers(first: 1, query: $q) { nodes { id emailMarketingConsent { marketingState } } } }',
      { q: `email:${JSON.stringify(email)}` },
    );
    const existing = found.customers.nodes[0];
    if (existing) {
      // Someone who unsubscribed stays unsubscribed.
      if (existing.emailMarketingConsent?.marketingState !== 'NOT_SUBSCRIBED') return;
      await shopifyAdminGraphQL(
        'mutation($input: CustomerEmailMarketingConsentUpdateInput!) { customerEmailMarketingConsentUpdate(input: $input) { userErrors { message } } }',
        { input: { customerId: existing.id, emailMarketingConsent: consent } },
      );
      return;
    }
    await shopifyAdminGraphQL(
      'mutation($input: CustomerInput!) { customerCreate(input: $input) { userErrors { message } } }',
      { input: { email, emailMarketingConsent: consent, tags: ['townies-popup'] } },
    );
  } catch (err) {
    console.error('[subscribeShopifyCustomer]', err);
  }
}
