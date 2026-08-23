'use client';

// The approve / mint-a-code calls, shared by the two rep surfaces.
//
// The roster's inline panel and the standalone rep page both drive the same two
// endpoints with the same payload and the same error triage — including the
// `shopify_scope` / `shopify_unconfigured` branch, which is easy to forget and
// which turns a confusing 409 into an actionable message about app scopes.
//
// What they legitimately DON'T share is what happens on success: the roster
// updates its local state optimistically (it owns the list), while the rep page
// calls router.refresh() (the server owns its data). So this returns a result
// and lets each caller finish the job, rather than pretending one flow fits.

export type RepActionResult =
  | { ok: true; discountCode?: string; gid?: string }
  | { ok: false; kind: 'scope' | 'error'; message: string };

async function readResult(res: Response): Promise<RepActionResult> {
  const json = await res.json().catch(() => ({} as Record<string, unknown>));
  if (res.ok) {
    // approve-ambassador returns `discountCode`; create-discount-code returns
    // `code`. Same value, two names — normalised here so callers see one field.
    return {
      ok: true,
      discountCode: (json.discountCode ?? json.code) as string | undefined,
      gid: json.gid as string | undefined,
    };
  }
  // The API distinguishes "your Shopify app lacks the scope" and "Shopify isn't
  // configured" from ordinary failures, because those two need a person to go
  // change something rather than retry.
  const kind =
    json.code === 'shopify_scope' || json.code === 'shopify_unconfigured' ? 'scope' : 'error';
  return { ok: false, kind, message: (json.error as string) ?? 'something went wrong' };
}

export async function approveRep(input: {
  applicationId: string;
  discountCode: string;
  discountPct: number;
  commissionPct: number;
  createInShopify: boolean;
}): Promise<RepActionResult> {
  const res = await fetch('/api/admin/approve-ambassador', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      discountCode: input.discountCode.trim().toUpperCase(),
    }),
  });
  return readResult(res);
}

export async function createRepCode(input: {
  applicationId: string;
  code: string;
  discountPct: number;
}): Promise<RepActionResult> {
  const res = await fetch('/api/admin/create-discount-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, code: input.code.trim() }),
  });
  return readResult(res);
}
