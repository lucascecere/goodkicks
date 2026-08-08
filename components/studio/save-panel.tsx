'use client';

// Content Studio — title, caption, schedule and save.
//
// The caption lives here rather than in the generated form because it isn't a
// template field: it's derived from the values, editable, and gets copied to
// the clipboard on the way to Instagram.

import { useCallback, useEffect, useRef, useState } from 'react';
import { STATUS_LABELS, type PostStatus } from '@/lib/studio/posts';

const inputClass =
  'w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-rust/70 transition-colors';

export type SaveState = {
  title: string;
  caption: string;
  status: PostStatus;
  /** datetime-local string, or '' for unscheduled. */
  scheduledFor: string;
};

export function SavePanel({
  templateId,
  values,
  state,
  onChange,
  onSave,
  saving,
  savedId,
  error,
}: {
  templateId: string;
  values: Record<string, unknown>;
  state: SaveState;
  onChange: (next: SaveState) => void;
  onSave: () => void;
  saving: boolean;
  savedId: string | null;
  error: string | null;
}) {
  const [copied, setCopied] = useState(false);
  // Once the caption is hand-edited, the generator stops touching it. Silently
  // overwriting someone's rewrite on the next keystroke would be maddening.
  const captionTouched = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (captionTouched.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/admin/studio/caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId, props: values }),
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!captionTouched.current && typeof json.caption === 'string') {
          onChange({ ...state, caption: json.caption });
        }
      } catch {
        // A missing suggestion is not worth surfacing — the box stays editable.
      }
    }, 500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // `state` is intentionally out of the dep list: including it would refire
    // this effect on its own result and loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, values]);

  const copyCaption = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(state.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, [state.caption]);

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 mt-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/30 mb-3 pb-2 border-b border-white/10">
        Save &amp; schedule
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-[11px] uppercase tracking-[0.14em] text-white/40 mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={state.title}
            placeholder="What this post is, for your own reference"
            onChange={(e) => onChange({ ...state, title: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] uppercase tracking-[0.14em] text-white/40">
              Caption
            </label>
            <button
              type="button"
              onClick={copyCaption}
              className="text-[11px] text-white/40 hover:text-white transition-colors"
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <textarea
            value={state.caption}
            rows={7}
            onChange={(e) => {
              captionTouched.current = true;
              onChange({ ...state, caption: e.target.value });
            }}
            className={`${inputClass} resize-y leading-relaxed font-mono text-xs`}
          />
          <p className="text-[11px] text-white/30 mt-1.5 leading-relaxed">
            Suggested from the values above until you edit it, then it&apos;s yours.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.14em] text-white/40 mb-1.5">
              Status
            </label>
            <select
              value={state.status}
              onChange={(e) => onChange({ ...state, status: e.target.value as PostStatus })}
              className={inputClass}
            >
              {(Object.keys(STATUS_LABELS) as PostStatus[]).map((s) => (
                <option key={s} value={s} className="bg-[#1A1A1A]">
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[0.14em] text-white/40 mb-1.5">
              Scheduled for
            </label>
            <input
              type="datetime-local"
              value={state.scheduledFor}
              onChange={(e) => onChange({ ...state, scheduledFor: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-xs leading-relaxed">
            {error}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? 'Saving…' : savedId ? 'Save changes' : 'Save to calendar'}
          </button>
          {savedId ? <span className="text-[11px] text-white/40">Saved ✓</span> : null}
        </div>
      </div>
    </div>
  );
}
