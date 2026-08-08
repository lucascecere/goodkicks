// Content Studio — download filenames.
//
// This exists because the first version named every export
// `<template-id>-<today>.png`. Generate a week of gameday posts and you get
// seven files called `sports-gameday-2026-08-07.png`, which the OS renames to
// (1), (2), (3)… — leaving you to open each one to find out which game it is.
// That made the batch button, the studio's biggest time-saver, useless.
//
// Date first so a Downloads folder sorts into posting order on its own.

/** Lowercase, hyphenated, ASCII-only — safe on every filesystem. */
export function slugify(input: string, maxLength = 48): string {
  const slug = input
    .normalize('NFKD')
    // Strip the combining marks NFKD just split off, so "Montréal" becomes
    // "montreal" rather than "montral". Written as escapes — literal combining
    // characters are invisible in most editors and get mangled on copy/paste.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length <= maxLength) return slug;
  // Cut at a word boundary rather than mid-word.
  const cut = slug.slice(0, maxLength);
  const lastDash = cut.lastIndexOf('-');
  return lastDash > maxLength * 0.6 ? cut.slice(0, lastDash) : cut;
}

/** Local YYYY-MM-DD. `toISOString()` would roll to tomorrow after 8pm ET. */
function localDate(value?: string | null): string {
  const d = value ? new Date(value) : new Date();
  const use = Number.isNaN(d.getTime()) ? new Date() : d;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${use.getFullYear()}-${pad(use.getMonth() + 1)}-${pad(use.getDate())}`;
}

/**
 * Filename for one post: `2026-08-08-yankees-at-red-sox.png`.
 *
 * Dated by when it's scheduled to go out, not when it was downloaded — the
 * folder then reads in posting order.
 */
export function postFilename(post: {
  title?: string | null;
  template_id?: string;
  scheduled_for?: string | null;
}): string {
  const date = localDate(post.scheduled_for);
  const name = slugify(post.title?.trim() || post.template_id || 'post');
  return `${date}-${name || 'post'}.png`;
}

/** Filename for an unsaved edit in the editor, which has no post row yet. */
export function draftFilename(templateId: string, title?: string | null): string {
  const name = slugify(title?.trim() || templateId);
  return `${localDate()}-${name || 'post'}.png`;
}

/**
 * Make every name in a batch unique.
 *
 * Two posts can legitimately share a title and a date — a doubleheader, or two
 * drafts of the same game. Left alone the ZIP would contain duplicate entries,
 * which some unzip tools silently collapse to one file.
 */
export function dedupeFilenames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    if (count === 0) return name;
    const dot = name.lastIndexOf('.');
    return dot === -1
      ? `${name}-${count + 1}`
      : `${name.slice(0, dot)}-${count + 1}${name.slice(dot)}`;
  });
}
