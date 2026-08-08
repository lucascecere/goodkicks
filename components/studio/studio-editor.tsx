'use client';

// Content Studio — the editor: form on the left, live render on the right.
//
// The preview <img> points at the same endpoint the export button fetches, so
// the picture on screen is literally the file you download. No second rendering
// path, nothing that can drift.
//
// Serves both "new from template" and "edit a saved post" — the only difference
// is whether it starts from the template's mock or a stored row.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { encodeProps } from '@/lib/studio/params';
import { draftFilename } from '@/lib/studio/filename';
import { downloadBlob } from './download';
import type { PostStatus } from '@/lib/studio/posts';
import { TemplateForm } from './template-form';
import { AutofillPanel } from './autofill-panel';
import { SavePanel, type SaveState } from './save-panel';
import type { FieldDef } from '@/lib/studio/types';

/**
 * The plain-data slice of a template. The registry itself must never reach a
 * client bundle — it imports every template's Satori render function.
 */
export type TemplateMeta = {
  id: string;
  name: string;
  description: string;
  canvas: { width: number; height: number };
  fields: FieldDef[];
  mock: Record<string, unknown>;
  /** Set when the template can be filled from a live feed. */
  autofillKind?: 'sports';
};

/** Present when editing something already saved. */
export type ExistingPost = {
  id: string;
  title: string;
  caption: string;
  status: PostStatus;
  scheduledFor: string | null;
  props: Record<string, unknown>;
};

/** Renders are ~200–400ms; re-firing on every keystroke would thrash. */
const PREVIEW_DEBOUNCE_MS = 350;

/**
 * Postgres hands back an ISO instant; <input type="datetime-local"> wants a
 * zoneless local string. Slicing the ISO would show UTC and quietly shift
 * every scheduled time by the offset.
 */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function StudioEditor({
  template,
  post,
}: {
  template: TemplateMeta;
  post?: ExistingPost;
}) {
  const router = useRouter();
  const initial = post?.props ?? template.mock;

  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [debounced, setDebounced] = useState<Record<string, unknown>>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [save, setSave] = useState<SaveState>({
    title: post?.title ?? template.name,
    caption: post?.caption ?? '',
    status: post?.status ?? 'draft',
    scheduledFor: toLocalInput(post?.scheduledFor ?? null),
  });
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(post?.id ?? null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(values), PREVIEW_DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [values]);

  const renderUrl = useMemo(
    () => `/api/studio/render/${template.id}?data=${encodeProps(debounced)}`,
    [template.id, debounced]
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [renderUrl]);

  const exportPng = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await fetch(renderUrl);
      if (!res.ok) throw new Error(await res.text());
      // Named from the post's title so a batch of exports doesn't land as
      // seven files with the same name, which is what the old
      // `<template>-<date>.png` scheme produced.
      downloadBlob(await res.blob(), draftFilename(template.id, save.title));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [renderUrl, template.id, save.title]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const body = {
        templateId: template.id,
        title: save.title,
        caption: save.caption,
        status: save.status,
        // A datetime-local string has no zone; letting Date interpret it as
        // local and converting to ISO is what makes "7pm" mean 7pm here.
        scheduledFor: save.scheduledFor ? new Date(save.scheduledFor).toISOString() : null,
        props: values,
      };

      const res = await fetch(
        savedId ? `/api/admin/studio/posts/${savedId}` : '/api/admin/studio/posts',
        {
          method: savedId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not save');

      setSavedId(json.post.id);
      // Refresh so the hub's queue and calendar pick the change up.
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }, [template.id, save, values, savedId, router]);

  const { width, height } = template.canvas;
  const shape = width === height ? 'Square' : height > width ? 'Portrait' : 'Landscape';

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <Link href="/admin/studio" className="text-white/40 hover:text-white text-xs transition-colors">
            ← Studio
          </Link>
          <h1 className="text-xl font-semibold text-white mt-2">{template.name}</h1>
          <p className="text-white/40 text-sm mt-1">
            {template.description} · {width}×{height} {shape}
          </p>
        </div>
        <button
          onClick={() => setValues(initial)}
          className="text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 rounded-lg px-3 py-2 transition-colors shrink-0"
        >
          Reset
        </button>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-8 items-start">
        {/* Controls */}
        <div>
          {template.autofillKind === 'sports' ? (
            <AutofillPanel
              templateId={template.id}
              // Merge, don't replace — the feed fills what it knows and leaves
              // the user's wordmark, photo and any hand-edits alone.
              onApply={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
            />
          ) : null}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
            <TemplateForm fields={template.fields} values={values} onChange={setValues} />
          </div>
          <SavePanel
            templateId={template.id}
            values={debounced}
            state={save}
            onChange={setSave}
            onSave={handleSave}
            saving={saving}
            savedId={savedId}
            error={saveError}
          />
        </div>

        {/* Live render */}
        <div className="lg:sticky lg:top-8">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">Live preview</p>
              {loading ? <p className="text-[11px] text-white/40">rendering…</p> : null}
            </div>

            <div
              className="relative w-full max-w-[320px] mx-auto bg-black/40 rounded-lg overflow-hidden"
              style={{ aspectRatio: `${width} / ${height}` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={renderUrl}
                src={renderUrl}
                alt={`${template.name} preview`}
                className="w-full h-full object-contain"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('Render failed — check the server log for details.');
                }}
              />
            </div>

            {error ? (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-xs leading-relaxed break-words">
                {error}
              </div>
            ) : null}

            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={exportPng}
                disabled={exporting}
                className="bg-brand-rust text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-rust/90 disabled:opacity-50 transition-colors"
              >
                {exporting ? 'Exporting…' : 'Export PNG'}
              </button>
              <a
                href={renderUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                Open full size ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
