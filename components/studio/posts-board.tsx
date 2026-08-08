'use client';

// Content Studio — the queue and the calendar.
//
// Two views of the same rows. The queue answers "what's next"; the calendar
// answers "what does the month look like". Both act on the same post objects,
// so an action in one is immediately right in the other.

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { STATUS_LABELS, type ContentPost, type PostStatus } from '@/lib/studio/posts';
import { postFilename } from '@/lib/studio/filename';
import { downloadBlob, downloadUrl } from './download';

const STATUS_STYLES: Record<PostStatus, string> = {
  draft: 'bg-white/10 text-white/60',
  scheduled: 'bg-blue-500/20 text-blue-300',
  posted: 'bg-green-500/20 text-green-300',
  archived: 'bg-white/5 text-white/30',
};

function StatusPill({ status }: { status: PostStatus }) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.12em] shrink-0 ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatWhen(iso: string | null): string {
  if (!iso) return 'Unscheduled';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unscheduled';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

function PostCard({
  post,
  onChanged,
}: {
  post: ContentPost;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const download = useCallback(async () => {
    setDownloading(true);
    try {
      await downloadUrl(
        `/api/studio/render/${post.template_id}?postId=${post.id}`,
        postFilename(post)
      );
    } catch {
      // Nothing to recover — the card stays put and the user can retry.
    } finally {
      setDownloading(false);
    }
  }, [post]);

  const act = useCallback(
    async (body: Record<string, unknown>) => {
      setBusy(true);
      try {
        await fetch(`/api/admin/studio/posts/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        onChanged();
      } finally {
        setBusy(false);
      }
    },
    [post.id, onChanged]
  );

  const remove = useCallback(async () => {
    // Deleting is the one destructive action on this screen, and the card is
    // small enough to mis-click.
    if (!confirm(`Delete “${post.title || 'Untitled'}”? This can't be undone.`)) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/studio/posts/${post.id}`, { method: 'DELETE' });
      onChanged();
    } finally {
      setBusy(false);
    }
  }, [post.id, post.title, onChanged]);

  const copyCaption = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(post.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, [post.caption]);

  return (
    <div
      className={`flex gap-4 bg-white/[0.03] border border-white/10 rounded-xl p-3 transition-opacity ${
        busy ? 'opacity-50' : ''
      }`}
    >
      {/* Real render of the saved props — lazy so a long queue doesn't fire
          twenty full-size renders on load. */}
      <Link href={`/admin/studio/post/${post.id}`} className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/studio/render/${post.template_id}?postId=${post.id}`}
          alt=""
          loading="lazy"
          className="w-16 h-20 object-cover rounded-lg bg-black/40"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/admin/studio/post/${post.id}`}
            className="text-sm text-white hover:text-brand-rust transition-colors truncate"
          >
            {post.title || 'Untitled'}
          </Link>
          <StatusPill status={post.status} />
        </div>

        <p className="text-[11px] text-white/40 mt-1">{formatWhen(post.scheduled_for)}</p>

        <div className="flex flex-wrap items-center gap-3 mt-2.5">
          <Link
            href={`/admin/studio/post/${post.id}`}
            className="text-[11px] text-white/50 hover:text-white transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={download}
            disabled={downloading}
            className="text-[11px] text-white/50 hover:text-white disabled:opacity-40 transition-colors"
          >
            {downloading ? 'Saving…' : 'Download'}
          </button>
          <a
            href={`/api/studio/render/${post.template_id}?postId=${post.id}`}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-white/50 hover:text-white transition-colors"
          >
            Open ↗
          </a>
          {post.caption ? (
            <button
              onClick={copyCaption}
              className="text-[11px] text-white/50 hover:text-white transition-colors"
            >
              {copied ? 'Copied ✓' : 'Copy caption'}
            </button>
          ) : null}
          {post.status !== 'posted' ? (
            <button
              onClick={() => act({ status: 'posted' })}
              className="text-[11px] text-green-400/70 hover:text-green-300 transition-colors"
            >
              Mark posted
            </button>
          ) : (
            <button
              onClick={() => act({ status: 'scheduled' })}
              className="text-[11px] text-white/40 hover:text-white transition-colors"
            >
              Un-post
            </button>
          )}
          <button
            onClick={remove}
            className="text-[11px] text-red-400/60 hover:text-red-300 transition-colors ml-auto"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- calendar */

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function Calendar({ posts, onChanged }: { posts: ContentPost[]; onChanged: () => void }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, ContentPost[]>();
    for (const post of posts) {
      if (!post.scheduled_for) continue;
      const d = new Date(post.scheduled_for);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(key, [...(map.get(key) ?? []), post]);
    }
    return map;
  }, [posts]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Leading blanks so the 1st lands under the right weekday.
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedPosts = selected ? byDay.get(selected) ?? [] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="text-white/40 hover:text-white text-sm px-2 transition-colors"
        >
          ←
        </button>
        <p className="text-sm text-white">
          {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(cursor)}
        </p>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="text-white/40 hover:text-white text-sm px-2 transition-colors"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-[10px] uppercase text-white/25 pb-1">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />;
          const key = `${year}-${month}-${day}`;
          const dayPosts = byDay.get(key) ?? [];
          const isToday =
            today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          return (
            <button
              key={key}
              onClick={() => setSelected(dayPosts.length ? key : null)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 text-xs transition-colors ${
                selected === key
                  ? 'bg-brand-rust/30 text-white'
                  : dayPosts.length
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'text-white/30 hover:bg-white/5'
              } ${isToday ? 'ring-1 ring-white/40' : ''}`}
            >
              <span>{day}</span>
              {dayPosts.length ? (
                <span className="flex gap-0.5">
                  {dayPosts.slice(0, 3).map((p) => (
                    <span
                      key={p.id}
                      className={`w-1 h-1 rounded-full ${
                        p.status === 'posted' ? 'bg-green-400' : 'bg-blue-400'
                      }`}
                    />
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedPosts.length ? (
        <div className="mt-5 space-y-2">
          {selectedPosts.map((p) => (
            <PostCard key={p.id} post={p} onChanged={onChanged} />
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-white/30 mt-5 leading-relaxed">
          Dots mark scheduled posts. Click a day to see them.
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- board */

export function PostsBoard({ initialPosts }: { initialPosts: ContentPost[] }) {
  const router = useRouter();
  const [view, setView] = useState<'queue' | 'calendar'>('queue');
  const [zipping, setZipping] = useState(false);
  const [zipNote, setZipNote] = useState<string | null>(null);
  const onChanged = useCallback(() => router.refresh(), [router]);

  // Anything still to do, soonest first. Posted and archived drop out — this
  // is a to-do list, not an archive.
  const queue = initialPosts.filter((p) => p.status === 'draft' || p.status === 'scheduled');
  const done = initialPosts.filter((p) => p.status === 'posted');

  const downloadAll = useCallback(async () => {
    setZipping(true);
    setZipNote(null);
    try {
      const res = await fetch('/api/admin/studio/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: queue.map((p) => p.id) }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Export failed (${res.status})`);
      }
      // Surfaced by the route so a short ZIP is never a silent surprise.
      const failed = Number(res.headers.get('X-Export-Failed') ?? '0');
      const skipped = Number(res.headers.get('X-Export-Skipped') ?? '0');
      downloadBlob(await res.blob(), `townies-posts-${new Date().toISOString().slice(0, 10)}.zip`);
      if (failed || skipped) {
        setZipNote(
          [
            failed ? `${failed} couldn't render` : '',
            skipped ? `${skipped} over the 40-post limit` : '',
          ]
            .filter(Boolean)
            .join(' · ')
        );
      }
    } catch (err) {
      setZipNote(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setZipping(false);
    }
  }, [queue]);

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-1 mb-5">
        {(['queue', 'calendar'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              view === v ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'
            }`}
          >
            {v}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-white/30">
          {queue.length} up next · {done.length} posted
        </span>
        {queue.length > 0 ? (
          <button
            onClick={downloadAll}
            disabled={zipping}
            className="bg-brand-rust text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-brand-rust/90 disabled:opacity-50 transition-colors"
          >
            {zipping ? 'Building ZIP…' : `Download all (${queue.length})`}
          </button>
        ) : null}
      </div>

      {zipNote ? (
        <p className="text-[11px] text-amber-300/80 mb-4 leading-relaxed">{zipNote}</p>
      ) : null}

      {view === 'calendar' ? (
        <Calendar posts={initialPosts} onChanged={onChanged} />
      ) : queue.length === 0 ? (
        <p className="text-[11px] text-white/30 leading-relaxed py-4">
          Nothing queued. Build something from a template below and hit “Save to calendar”.
        </p>
      ) : (
        <div className="space-y-2">
          {queue.map((p) => (
            <PostCard key={p.id} post={p} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}
