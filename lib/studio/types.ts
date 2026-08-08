// Content Studio — the template contract.
//
// Every template in the studio is one file that declares four things: what it
// is, what values it takes, what those values look like when nobody has filled
// anything in, and how it draws itself. The studio reads that declaration and
// generates the rest — the gallery card, the input form, the live preview, the
// PNG export. Adding a template is writing one file and adding one registry
// line; no studio code changes.
//
// `render` is deliberately NOT called `Component`: these functions are handed
// to Satori, never mounted in the browser. Naming them components invites
// hooks and event handlers that would silently do nothing.

import type { ReactElement } from 'react';
import type { ZodType } from 'zod';

export type TemplateCategory = 'sports' | 'news' | 'town' | 'brand';

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  sports: 'Sports',
  news: 'News & Headlines',
  town: 'Town Content',
  brand: 'Brand & Product',
};

// Order the gallery renders categories in.
export const CATEGORY_ORDER: TemplateCategory[] = ['sports', 'news', 'town', 'brand'];

export type Canvas = { width: number; height: number };

// Instagram's three shapes. Templates pick one; the studio never assumes.
export const CANVAS = {
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
} as const;

/** A selectable option in a `select` field. */
export type FieldOption = { value: string; label: string };

/**
 * One input in the generated form. `key` is a dotted path into the template's
 * props (`away.abbr`, `odds.total`) so nested shapes don't need flattening.
 *
 * Declared explicitly rather than introspected out of the zod schema — the
 * schema knows types, not intent. It can't tell a color from a string, or that
 * a field belongs under a "Bottom bar" heading.
 */
export type FieldDef = {
  key: string;
  label: string;
  /** Section heading this field sits under in the form. */
  group?: string;
  /** Small hint under the input. */
  help?: string;
  placeholder?: string;
} & (
  | { type: 'text' }
  | { type: 'textarea'; rows?: number }
  | { type: 'number'; min?: number; max?: number; step?: number }
  | { type: 'toggle' }
  | { type: 'select'; options: FieldOption[] }
  | { type: 'team' }
  /** Sports only: picks the league, which scopes the team pickers to that sport
   *  and re-tags the league-dependent labels. Derived from the home team, so it
   *  needs no stored prop of its own. */
  | { type: 'league' }
  | { type: 'image' }
  | { type: 'date' }
  | { type: 'time' }
  | { type: 'color' }
);

/**
 * Passed to `render` alongside props. Templates must never build a URL by hand
 * — Satori has no notion of a page origin, so a bare `/brand/x.jpg` silently
 * renders nothing.
 */
export type RenderContext = {
  /** Absolute origin of the request, e.g. `http://localhost:3000`. */
  origin: string;
  /**
   * Resolve any image reference (relative path or absolute URL) to something
   * Satori can actually draw. Returns undefined when the image could not be
   * fetched, so templates can fall back instead of exploding the whole render.
   */
  img: (src: string | undefined | null) => string | undefined;
  /**
   * The real Townies cursive wordmark, pre-resolved. Lives on the context
   * rather than in each template's props because every template's footer wants
   * it and none of them should have to remember to load it.
   */
  brandMark?: string;
};

export type TemplateDef<P = Record<string, unknown>> = {
  id: string;
  name: string;
  category: TemplateCategory;
  /** One line, shown on the gallery card. */
  description: string;
  canvas: Canvas;
  /** Validates and coerces incoming params. Source of truth for prop shape. */
  schema: ZodType<P>;
  fields: FieldDef[];
  /** A complete, plausible set of values. Renders with zero configuration. */
  mock: P;
  /**
   * Images the template will draw that are NOT literal values in its props.
   *
   * The renderer pre-fetches every image it can find by walking props, which
   * covers background photos. It cannot find images reached indirectly — a
   * team logo, for instance, is looked up from a palette using an id like
   * `mlb-bos`, so the URL never appears in props and would silently fall back.
   * Declare those here.
   */
  imageRefs?: (props: P) => (string | undefined)[];
  /**
   * Marks the template as fillable from a live feed. Plain data, not a
   * function, because the editor is a client component and has to know whether
   * to show the auto-fill panel without importing any provider code.
   */
  autofillKind?: 'sports';
  /** Suggested Instagram caption, built from the filled-in values. */
  caption?: (props: P) => string;
  render: (props: P, ctx: RenderContext) => ReactElement;
};

/**
 * The registry holds templates with mutually incompatible prop shapes, and the
 * studio treats them uniformly (form, preview, export all drive off `fields`
 * and `schema`). `any` is the honest type for that erasure — every actual read
 * of props goes back through `schema.parse`, which restores real safety.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTemplate = TemplateDef<any>;

/** Identity helper that pins P from the object literal, keeping inference tight. */
export function defineTemplate<P>(def: TemplateDef<P>): TemplateDef<P> {
  return def;
}
