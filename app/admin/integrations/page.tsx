import { listWebhooks, REQUIRED_WEBHOOKS } from '@/lib/shopify/webhooks';
import { SITE_URL } from '@/lib/seo/site';
import { IntegrationsClient, type WebhookRow } from './integrations-client';

export const dynamic = 'force-dynamic';

/**
 * "Is Shopify still talking to us?" — answered on a page instead of discovered
 * when the data stops arriving.
 *
 * Only APP-OWNED subscriptions are visible to the API. Anything created by hand
 * in the Shopify admin UI will NOT appear here, which is the entire reason the
 * app creates its own: a subscription nothing can see is a subscription nothing
 * can repair.
 */
export default async function AdminIntegrationsPage() {
  const live = await listWebhooks();
  const base = SITE_URL.replace(/\/$/, '');

  const rows: WebhookRow[] = REQUIRED_WEBHOOKS.map((w) => {
    const url = `${base}${w.path}`;
    const found = live.find((s) => s.topic === w.topic && s.endpoint?.callbackUrl === url);
    return { topic: w.topic, url, registered: Boolean(found) };
  });

  const extra = live
    .filter((s) => !REQUIRED_WEBHOOKS.some((w) => w.topic === s.topic))
    .map((s) => ({ topic: s.topic, url: s.endpoint?.callbackUrl ?? '—', registered: true }));

  return <IntegrationsClient rows={rows} extra={extra} />;
}
