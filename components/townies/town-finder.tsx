'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { MaMark } from '@/components/brand/wordmark';

/**
 * The town finder — what the header's search icon actually does now.
 *
 * Nobody browses Townies the way they browse a normal shop. They arrive with
 * one town in mind and want to know, in a second, whether it exists. A
 * catalogue search would return "Milton Lifestyle Hat" and "Milton Everyday
 * Hat"; this returns "Milton — South Shore" and takes you there. And when the
 * town is NOT here, the empty state is the site's most important form:
 * request it, with the name already filled in.
 *
 * The list comes from /api/towns on first open, so the header never carries
 * the catalogue in its bundle and a new town appears within a minute.
 */
type Town = { slug: string; name: string; region: string; regionLabel: string; href: string };

export function TownFinder() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [towns, setTowns] = useState<Town[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    if (towns === null) {
      fetch('/api/towns')
        .then((r) => r.json())
        .then((j: { towns: Town[] }) => setTowns(j.towns))
        .catch(() => setTowns([]));
    }
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, towns]);

  const query = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!towns) return [];
    if (!query) return towns;
    const starts = towns.filter((t) => t.name.toLowerCase().startsWith(query));
    const contains = towns.filter(
      (t) => !t.name.toLowerCase().startsWith(query) && t.name.toLowerCase().includes(query),
    );
    return [...starts, ...contains];
  }, [towns, query]);

  const requestHref = `/request-a-town${query ? `?town=${encodeURIComponent(q.trim())}` : ''}`;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const first = results[0];
    setOpen(false);
    router.push(first && query ? first.href : requestHref);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Find your town"
        className="p-2 text-text hover:text-accent transition-colors"
      >
        <Search size={19} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Find your town">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-x-0 top-0 sm:top-16 sm:mx-auto sm:max-w-xl bg-bg sm:rounded-sm shadow-2xl border-b sm:border border-rule max-h-[100dvh] sm:max-h-[80vh] flex flex-col">
            <form onSubmit={submit} className="flex items-center gap-3 px-4 sm:px-5 h-16 border-b border-rule">
              <Search size={18} className="text-muted shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Find your town…"
                aria-label="Town name"
                autoComplete="off"
                className="flex-1 bg-transparent text-base text-text placeholder:text-muted/70 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-2 -mr-2 text-muted hover:text-text transition-colors"
              >
                <X size={18} />
              </button>
            </form>

            <div className="overflow-y-auto">
              {towns === null ? (
                <p className="px-5 py-6 text-sm text-muted">Loading towns…</p>
              ) : results.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="heading text-xl text-text mb-2">
                    {q.trim() ? `No ${q.trim()} yet.` : 'No towns yet.'}
                  </p>
                  <p className="text-sm text-muted mb-5">
                    Towns get made because people ask. Put yours in and we count it.
                  </p>
                  <Link
                    href={requestHref}
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center bg-ink text-ink-contrast px-6 py-3 rounded-sm text-[0.6875rem] font-semibold uppercase tracking-[0.14em] hover:bg-accent hover:text-accent-contrast transition-colors"
                  >
                    Request {q.trim() || 'your town'}
                  </Link>
                </div>
              ) : (
                <ul className="py-2">
                  {results.map((t) => (
                    <li key={t.slug}>
                      <Link
                        href={t.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-surface transition-colors"
                      >
                        <span className="flex items-center gap-3">
                          <MaMark className="h-2.5 w-auto text-accent shrink-0" />
                          <span className="heading text-base text-text">{t.name}</span>
                        </span>
                        <span className="text-[0.625rem] uppercase tracking-[0.18em] text-muted">
                          {t.regionLabel}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {query && (
                    <li className="border-t border-rule mt-2 pt-2">
                      <Link
                        href={requestHref}
                        onClick={() => setOpen(false)}
                        className="block px-5 py-3 text-sm text-muted hover:text-text transition-colors"
                      >
                        Not the one? <span className="underline underline-offset-4">Request &ldquo;{q.trim()}&rdquo;</span>
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div className="border-t border-rule px-5 py-3 flex items-center justify-between text-[0.625rem] uppercase tracking-[0.18em] text-muted">
              <span>{towns ? `${towns.length} towns live` : ''}</span>
              <Link href="/shop" onClick={() => setOpen(false)} className="underline underline-offset-4 hover:text-text">
                Browse all
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
