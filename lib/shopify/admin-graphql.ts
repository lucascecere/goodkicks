// Shared Shopify Admin GraphQL client.
//
// The Admin token was previously read ad hoc in five separate files with no
// shared error handling, which meant a missing OAuth scope surfaced as a
// generic 500. This centralises the call and turns the one failure mode we
// actually hit — a token missing `write_discounts` — into a typed error the
// admin UI can render as an actionable instruction.

export const SHOPIFY_ADMIN_API_VERSION = '2024-10';

/** Thrown when Shopify rejects the request because the token lacks a scope. */
export class ShopifyScopeError extends Error {
  readonly requiredScope: string;

  constructor(requiredScope: string) {
    super(
      `Shopify token is missing the \`${requiredScope}\` scope. Add it in Shopify Admin → Settings → Apps and sales channels → Develop apps → Configuration → Admin API scopes, then reinstall the app and update SHOPIFY_ADMIN_API_TOKEN.`,
    );
    this.name = 'ShopifyScopeError';
    this.requiredScope = requiredScope;
  }
}

/** Thrown when the Admin API env vars aren't configured at all. */
export class ShopifyNotConfiguredError extends Error {
  constructor() {
    super('SHOPIFY_ADMIN_API_TOKEN / SHOPIFY_STORE_DOMAIN are not set.');
    this.name = 'ShopifyNotConfiguredError';
  }
}

type GraphQLError = {
  message: string;
  extensions?: { code?: string; requiredAccess?: string };
};

export function isShopifyAdminConfigured(): boolean {
  return Boolean(process.env.SHOPIFY_ADMIN_API_TOKEN && process.env.SHOPIFY_STORE_DOMAIN);
}

export async function shopifyAdminGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
  if (!domain || !token) throw new ShopifyNotConfiguredError();

  const res = await fetch(
    `https://${domain}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    },
  );

  const json = (await res.json().catch(() => null)) as
    | { data?: T; errors?: GraphQLError[] }
    | null;

  if (!json) {
    throw new Error(`Shopify Admin API returned a non-JSON response (${res.status}).`);
  }

  const errors = json.errors ?? [];
  const denied = errors.find((e) => e.extensions?.code === 'ACCESS_DENIED');
  if (denied) {
    // Shopify puts the scope name in `requiredAccess` as prose, e.g.
    // "Apps must have `write_discounts` access scope." — pull the identifier out.
    const scope =
      denied.extensions?.requiredAccess?.match(/`([a-z_]+)`/)?.[1] ??
      denied.message.match(/`([a-z_]+)`/)?.[1] ??
      'write_discounts';
    throw new ShopifyScopeError(scope);
  }
  if (errors.length) {
    throw new Error(`Shopify Admin API error: ${errors.map((e) => e.message).join(', ')}`);
  }
  if (!json.data) {
    throw new Error(`Shopify Admin API returned no data (${res.status}).`);
  }

  return json.data;
}
