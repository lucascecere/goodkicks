'use client';

import { useState } from 'react';

export function SyncShopifyButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [synced, setSynced] = useState<number | null>(null);

  async function handleSync() {
    setState('loading');
    try {
      const res = await fetch('/api/admin/sync-shopify-contacts', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSynced(data.synced);
        setState('done');
        setTimeout(() => setState('idle'), 4000);
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={state === 'loading'}
      className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-40"
    >
      {state === 'loading' && 'syncing…'}
      {state === 'done' && `✓ synced ${synced} orders`}
      {state === 'error' && 'sync failed'}
      {state === 'idle' && 'sync shopify orders'}
    </button>
  );
}
