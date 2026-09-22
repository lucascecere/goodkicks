'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type WebhookRow = { topic: string; url: string; registered: boolean };

export function IntegrationsClient({ rows, extra }: { rows: WebhookRow[]; extra: WebhookRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const missing = rows.filter((r) => !r.registered);

  async function repair() {
    setBusy(true);
    setResult(null);
    const res = await fetch('/api/admin/webhooks', { method: 'POST' });
    const json = (await res.json()) as {
      created?: string[];
      present?: string[];
      failed?: Array<{ topic: string; error: string }>;
      skipped?: string;
    };
    setResult(
      json.skipped
        ? json.skipped
        : json.failed?.length
          ? `Failed: ${json.failed.map((f) => `${f.topic} — ${f.error}`).join('; ')}`
          : json.created?.length
            ? `Re-created ${json.created.join(', ')}.`
            : 'All present — nothing to repair.',
    );
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Integrations</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/50">
          Shopify deletes a webhook after repeated delivery failures and doesn&apos;t tell us —
          which is why these used to go missing. The app now owns them and repairs any that
          vanish on the daily cron, so this page should stay green on its own.
        </p>
      </div>

      <div
        className={`rounded-lg border p-4 ${
          missing.length === 0
            ? 'border-emerald-500/30 bg-emerald-500/10'
            : 'border-amber-500/30 bg-amber-500/10'
        }`}
      >
        <p className="text-sm font-semibold text-white">
          {missing.length === 0
            ? 'All Shopify webhooks registered.'
            : `${missing.length} webhook${missing.length === 1 ? '' : 's'} missing.`}
        </p>
        <p className="mt-1 text-xs text-white/60">
          {missing.length === 0
            ? 'Orders reach contacts, and fulfilments queue a review request.'
            : 'The daily cron will put these back, or repair now.'}
        </p>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.topic}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${r.registered ? 'bg-emerald-400' : 'bg-amber-400'}`}
            />
            <span className="font-mono text-sm text-white">{r.topic}</span>
            <span className="truncate font-mono text-xs text-white/40">{r.url}</span>
            <span className="ml-auto text-xs uppercase tracking-wider text-white/50">
              {r.registered ? 'Registered' : 'Missing'}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={repair}
          disabled={busy}
          className="rounded bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black transition-colors hover:bg-white/80 disabled:opacity-50"
        >
          {busy ? 'Checking…' : 'Repair now'}
        </button>
        {result && <span className="text-xs text-white/60">{result}</span>}
      </div>

      {extra.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/60">
            Other app-owned webhooks
          </h2>
          <div className="space-y-2">
            {extra.map((r) => (
              <div
                key={r.topic + r.url}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3"
              >
                <span className="font-mono text-xs text-white/70">{r.topic}</span>
                <span className="truncate font-mono text-xs text-white/40">{r.url}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="max-w-2xl text-xs leading-relaxed text-white/40">
        Webhooks created by hand in the Shopify admin UI are invisible to the API and will not
        show up here, even though they still fire. Both signing secrets are accepted, so the
        hand-made ones keep working — you can delete them in Shopify once these read Registered.
      </p>
    </div>
  );
}
