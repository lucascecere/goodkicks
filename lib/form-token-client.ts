'use client';

import { useEffect } from 'react';

// The browser half of the form token (server half: lib/form-guard.ts).
//
// One token per page load, fetched as soon as any form mounts and reused by
// every form on the page. formToken() also waits out the server's minimum
// fill time when someone is quicker than that (a wheel spun the instant it
// appears), so a real person is never mistaken for a bot.

const MIN_AGE_MS = 2_700; // server floor is 2.5s; a little slack for the round trip

let pending: Promise<{ token: string; at: number } | null> | null = null;

function fetchToken(attempt = 0): Promise<{ token: string; at: number } | null> {
  return fetch('/api/form-token', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { token?: string } | null) => (j?.token ? { token: j.token, at: performance.now() } : null))
    .catch(() => null)
    .then((got) => {
      if (got || attempt >= 2) return got;
      return new Promise<{ token: string; at: number } | null>((r) => setTimeout(r, 1000 * (attempt + 1))).then(() =>
        fetchToken(attempt + 1),
      );
    });
}

export function prefetchFormToken(): void {
  if (!pending) {
    pending = fetchToken().then((got) => {
      if (!got) pending = null; // let the next call try again
      return got;
    });
  }
}

export async function formToken(): Promise<string> {
  prefetchFormToken();
  const got = await pending;
  if (!got) return '';
  const wait = MIN_AGE_MS - (performance.now() - got.at);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  return got.token;
}

/** Call in any component that renders a public form. */
export function useFormToken(): void {
  useEffect(() => {
    prefetchFormToken();
  }, []);
}
