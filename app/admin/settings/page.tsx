import {
  shopifyAdminGraphQL,
  isShopifyAdminConfigured,
  ShopifyScopeError,
} from '@/lib/shopify/admin-graphql';
import { TOWNIES_COLLECTION, GOODKICKS_COLLECTION } from '@/lib/shopify/collections';
import { Card, PageHeader } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

type Check = { label: string; ok: boolean; detail: string };

// Cheapest possible probe of the discount scope — one node, no fields we don't
// need. This is the failure everything else in the rep program hangs off, so
// it's worth checking live rather than documenting.
async function checkDiscountScope(): Promise<Check> {
  if (!isShopifyAdminConfigured()) {
    return {
      label: 'Shopify discount access',
      ok: false,
      detail: 'SHOPIFY_ADMIN_API_TOKEN / SHOPIFY_STORE_DOMAIN are not set.',
    };
  }
  try {
    await shopifyAdminGraphQL('{ codeDiscountNodes(first: 1) { nodes { id } } }');
    return {
      label: 'Shopify discount access',
      ok: true,
      detail: 'Token can read and write discount codes — one-click code creation works.',
    };
  } catch (err) {
    if (err instanceof ShopifyScopeError) {
      return { label: 'Shopify discount access', ok: false, detail: err.message };
    }
    return {
      label: 'Shopify discount access',
      ok: false,
      detail: err instanceof Error ? err.message : 'Unknown error contacting Shopify.',
    };
  }
}

async function checkOrderScope(): Promise<Check> {
  if (!isShopifyAdminConfigured()) {
    return { label: 'Shopify order access', ok: false, detail: 'Admin API not configured.' };
  }
  try {
    await shopifyAdminGraphQL('{ orders(first: 1) { nodes { id } } }');
    return {
      label: 'Shopify order access',
      ok: true,
      detail: 'Sales tracking can read orders and attribute them to rep codes.',
    };
  } catch (err) {
    return {
      label: 'Shopify order access',
      ok: false,
      detail: err instanceof Error ? err.message : 'Unknown error contacting Shopify.',
    };
  }
}

function StatusRow({ check }: { check: Check }) {
  return (
    <div className="flex items-start gap-3 border-b border-town-cream/[0.07] px-4 py-4 last:border-b-0 sm:px-5">
      <span
        className={`mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-town-navy ${
          check.ok ? 'bg-emerald-400' : 'bg-amber-400'
        }`}
      >
        {check.ok ? '✓' : '!'}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-town-cream">{check.label}</p>
        <p className="mt-0.5 break-words text-xs leading-relaxed text-town-cream/55">{check.detail}</p>
      </div>
    </div>
  );
}

export default async function SettingsPage() {
  const [discountCheck, orderCheck] = await Promise.all([checkDiscountScope(), checkOrderScope()]);

  const towniesFrom = process.env.TOWNIES_FROM_EMAIL ?? 'info@goodkicks.co';
  const towniesOwnDomain = towniesFrom.endsWith('@townies.shop');

  const emailCheck: Check = {
    label: 'Email sending',
    ok: Boolean(process.env.RESEND_API_KEY) && towniesOwnDomain,
    detail: !process.env.RESEND_API_KEY
      ? 'RESEND_API_KEY is not set — no application confirmations or welcome emails will go out.'
      : towniesOwnDomain
        ? `Resend configured. Townies mail sends from ${towniesFrom}, Good Kicks from info@goodkicks.co. Both domains are verified on the same Resend account, which is what lets one API key serve both.`
        : `Resend configured, but Townies mail still sends from ${towniesFrom}. Verify townies.shop in Resend and set TOWNIES_FROM_EMAIL to send from a Townies address.`,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Settings"
        title="Settings"
        description="rep program configuration and integration health"
      />
      <div className="max-w-3xl space-y-6">

      <Card title="Integration Status" className="overflow-hidden">
        <StatusRow check={discountCheck} />
        <StatusRow check={orderCheck} />
        <StatusRow check={emailCheck} />
      </Card>

      <Card title="How Commission Works" className="overflow-hidden">
        <div className="space-y-3 px-4 py-5 text-sm leading-relaxed text-town-cream/60 sm:px-5">
          <p>
            Commission is a straight percentage of <strong className="text-town-cream">revenue</strong> —
            what the customer actually paid after their discount — not of profit. There are no tiers:
            each rep&apos;s discount % and commission % are set individually on their profile, capped
            at 20%.
          </p>
          <p>
            A rep is only credited for their own brand&apos;s line items, so a mixed cart splits
            correctly and a Town Rep is never paid on a Good Kicks sale.
          </p>
          <div className="space-y-1 rounded-lg border border-town-cream/10 bg-town-navy/60 p-4 font-mono text-xs text-town-cream">
            <p>$29.99 hat · 15% off code · 10% commission</p>
            <p className="text-town-cream/55">customer pays $25.49 → rep earns $2.55</p>
          </div>
        </div>
      </Card>

      <Card title="Code Scoping" className="overflow-hidden">
        <div className="space-y-2 px-4 py-5 text-sm leading-relaxed text-town-cream/60 sm:px-5">
          <p>New rep codes are limited to their brand&apos;s Shopify collection:</p>
          <ul className="space-y-1 pt-1">
            <li className="flex flex-wrap justify-between gap-x-3">
              <span className="text-town-cream">Townies</span>
              <span className="break-all font-mono text-xs">{TOWNIES_COLLECTION}</span>
            </li>
            <li className="flex flex-wrap justify-between gap-x-3">
              <span className="text-town-cream">Good Kicks</span>
              <span className="break-all font-mono text-xs">{GOODKICKS_COLLECTION}</span>
            </li>
          </ul>
          <p className="pt-2 text-xs">
            Override with SHOPIFY_TOWNIES_COLLECTION / SHOPIFY_GOODKICKS_COLLECTION.
          </p>
        </div>
      </Card>
      </div>
    </div>
  );
}
