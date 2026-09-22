import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { shopifyAdminGraphQL, isShopifyAdminConfigured } from './admin-graphql';
import { SITE_URL } from '@/lib/seo/site';

/**
 * Shopify webhook subscriptions: own them, and put them back when they vanish.
 *
 * ──────────────────────────────────────────────────────────────────────────
 *  WHY THIS FILE EXISTS
 *
 *  Shopify DELETES a webhook subscription after repeated delivery failures —
 *  "after multiple failures in a 24-hour period, the webhook subscription is
 *  removed", and a response slower than FIVE SECONDS counts as a failure. It
 *  does not pause it or warn us in-band; it removes it, and deliveries simply
 *  stop. Orders quietly stop reaching the contacts table and the only symptom
 *  is data that isn't there.
 *
 *  Lucas has re-created these by hand about seven times. Each round trip is
 *  the same story: something made the endpoint fail or time out for a day,
 *  Shopify unsubscribed, nobody found out until the data went missing.
 *
 *  Two halves to fixing it, and BOTH are needed:
 *
 *  1. STOP EARNING THE DELETION. The webhook routes now acknowledge inside a
 *     few milliseconds and do their real work in `after()`, so a slow database
 *     can no longer produce a timeout. They also no longer return 5xx for
 *     anything a retry wouldn't fix.
 *
 *  2. PUT IT BACK AUTOMATICALLY. Subscriptions created in the Shopify ADMIN UI
 *     are invisible to the API — `webhookSubscriptions` returns nothing for
 *     them — so nothing can check whether they still exist. App-owned
 *     subscriptions created through the Admin API ARE visible, so `reconcile()`
 *     below can list them, notice a missing one and re-create it. It runs on
 *     the daily cron: worst case a subscription is gone for under 24 hours and
 *     comes back without anyone touching Shopify.
 * ──────────────────────────────────────────────────────────────────────────
 */

/** The subscriptions this app requires. Add a topic here and it self-installs. */
export const REQUIRED_WEBHOOKS = [
  { topic: 'ORDERS_CREATE', path: '/api/webhooks/shopify/orders' },
  { topic: 'FULFILLMENTS_CREATE', path: '/api/webhooks/shopify/fulfillments' },
] as const;

/**
 * Verify a webhook signature against EITHER signing secret.
 *
 * There are two, and which one applies depends on how the subscription was
 * made — this is the detail that makes "just re-create it in the UI" and
 * "create it via the API" incompatible if you only check one:
 *
 *   - Created in the Shopify admin UI → signed with the shared store webhook
 *     secret, i.e. SHOPIFY_WEBHOOK_SECRET.
 *   - Created via the Admin API by this app → signed with the APP's client
 *     secret, i.e. SHOPIFY_CLIENT_SECRET.
 *
 * Both are accepted so the hand-made subscriptions keep working while the
 * app-owned ones take over, and so deleting either later changes nothing.
 */
export function verifyWebhook(rawBody: string, header: string | null): boolean {
  if (!header) return false;

  const secrets = [process.env.SHOPIFY_WEBHOOK_SECRET, process.env.SHOPIFY_CLIENT_SECRET].filter(
    (s): s is string => Boolean(s),
  );
  if (secrets.length === 0) return false;

  const provided = Buffer.from(header, 'utf8');

  // Every candidate is checked even after a match, so the work done does not
  // depend on WHICH secret matched.
  let matched = false;
  for (const secret of secrets) {
    const digest = Buffer.from(
      createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64'),
      'utf8',
    );
    // timingSafeEqual throws on a length mismatch, so guard before comparing.
    if (digest.length === provided.length && timingSafeEqual(digest, provided)) matched = true;
  }
  return matched;
}

type SubscriptionNode = {
  id: string;
  topic: string;
  endpoint: { callbackUrl?: string } | null;
};

const LIST_QUERY = `
  query WebhookSubscriptions {
    webhookSubscriptions(first: 100) {
      edges {
        node {
          id
          topic
          endpoint { ... on WebhookHttpEndpoint { callbackUrl } }
        }
      }
    }
  }
`;

const CREATE_MUTATION = `
  mutation CreateWebhook($topic: WebhookSubscriptionTopic!, $callbackUrl: URL!) {
    webhookSubscriptionCreate(
      topic: $topic
      webhookSubscription: { callbackUrl: $callbackUrl, format: JSON }
    ) {
      webhookSubscription { id topic }
      userErrors { field message }
    }
  }
`;

export type ReconcileResult = {
  ok: boolean;
  /** Topics that were already registered and pointing at the right URL. */
  present: string[];
  /** Topics that were missing and have just been re-created. */
  created: string[];
  /** Topics that could not be created, with the reason. */
  failed: Array<{ topic: string; error: string }>;
  skipped?: string;
};

/**
 * Make the store's app-owned subscriptions match REQUIRED_WEBHOOKS.
 *
 * Only ever ADDS. It never deletes a subscription it doesn't recognise —
 * the hand-made admin-UI ones are invisible here anyway, and an over-eager
 * cleanup that removed somebody else's integration would be a far worse
 * failure than a duplicate delivery.
 *
 * A duplicate delivery is safe by construction: the contacts write is an
 * upsert, and review requests are guarded by a one-per-order unique
 * constraint.
 */
export async function reconcileWebhooks(): Promise<ReconcileResult> {
  if (!isShopifyAdminConfigured()) {
    return { ok: false, present: [], created: [], failed: [], skipped: 'Shopify admin not configured' };
  }

  const base = SITE_URL.replace(/\/$/, '');
  const present: string[] = [];
  const created: string[] = [];
  const failed: Array<{ topic: string; error: string }> = [];

  let existing: SubscriptionNode[] = [];
  try {
    const data = await shopifyAdminGraphQL<{
      webhookSubscriptions: { edges: Array<{ node: SubscriptionNode }> };
    }>(LIST_QUERY);
    existing = data.webhookSubscriptions.edges.map((e) => e.node);
  } catch (err) {
    return {
      ok: false,
      present: [],
      created: [],
      failed: [{ topic: '*', error: err instanceof Error ? err.message : String(err) }],
    };
  }

  for (const want of REQUIRED_WEBHOOKS) {
    const callbackUrl = `${base}${want.path}`;
    const match = existing.find(
      (s) => s.topic === want.topic && s.endpoint?.callbackUrl === callbackUrl,
    );
    if (match) {
      present.push(want.topic);
      continue;
    }

    try {
      const data = await shopifyAdminGraphQL<{
        webhookSubscriptionCreate: {
          webhookSubscription: { id: string } | null;
          userErrors: Array<{ message: string }>;
        };
      }>(CREATE_MUTATION, { topic: want.topic, callbackUrl });

      const errors = data.webhookSubscriptionCreate.userErrors;
      if (errors.length > 0) {
        const message = errors.map((e) => e.message).join('; ');
        // Shopify rejects an exact duplicate rather than creating a second —
        // which means it is already there and this is a success, not a failure.
        if (/already/i.test(message)) present.push(want.topic);
        else failed.push({ topic: want.topic, error: message });
        continue;
      }
      if (data.webhookSubscriptionCreate.webhookSubscription) {
        created.push(want.topic);
        console.warn(`[webhooks] RE-CREATED missing subscription: ${want.topic} → ${callbackUrl}`);
      }
    } catch (err) {
      failed.push({ topic: want.topic, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return { ok: failed.length === 0, present, created, failed };
}

/** Read-only: what is registered right now. For the admin health panel. */
export async function listWebhooks(): Promise<SubscriptionNode[]> {
  if (!isShopifyAdminConfigured()) return [];
  try {
    const data = await shopifyAdminGraphQL<{
      webhookSubscriptions: { edges: Array<{ node: SubscriptionNode }> };
    }>(LIST_QUERY);
    return data.webhookSubscriptions.edges.map((e) => e.node);
  } catch {
    return [];
  }
}
