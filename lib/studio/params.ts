// Content Studio — turning URL params into template props, and back.
//
// The preview page and the PNG route share this file. That's deliberate: if the
// form and the renderer parsed params separately they would drift, and the
// preview would stop being the render. Anything you see is what exports.

import type { TemplateDef } from './types';

/**
 * Query strings are all strings. Rather than making every template's schema
 * fight with coercion, we look at the type of the same key in its mock — which
 * is a complete, correctly-typed example by contract — and coerce to match.
 *
 * Notably this handles booleans properly: `z.coerce.boolean()` would turn the
 * string "false" into `true`, because a non-empty string is truthy. That single
 * gotcha would silently break every toggle in the studio.
 */
export function coerceToMockTypes(
  raw: Record<string, string | undefined>,
  mock: unknown
): Record<string, unknown> {
  const reference = (mock ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    const ref = reference[key];

    if (typeof ref === 'boolean') {
      out[key] = value === 'true' || value === '1';
    } else if (typeof ref === 'number') {
      const n = Number(value);
      if (Number.isFinite(n)) out[key] = n;
    } else {
      out[key] = value;
    }
  }

  return out;
}

/**
 * Merge incoming values over the template's mock, then validate.
 *
 * Falling back to the mock on a validation failure is intentional: a studio
 * that renders a slightly-wrong graphic is useful, one that renders a 500 page
 * is not. Bad params are a preview problem, not a crash.
 */
export function parseProps<P>(template: TemplateDef<P>, raw: Record<string, unknown>): P {
  const merged = { ...(template.mock as Record<string, unknown>), ...raw };
  const result = template.schema.safeParse(merged);
  return result.success ? result.data : template.mock;
}

/* ------------------------------------------------- preview transport (data) */

/**
 * Props for an UNSAVED edit travel to the render route as one base64url blob
 * rather than thirty query params. Keeps URLs manageable and sidesteps having
 * to escape headline text that's full of punctuation.
 */
function toBase64(json: string): string {
  if (typeof window === 'undefined') return Buffer.from(json, 'utf8').toString('base64');
  // btoa is latin1-only, so UTF-8 has to be widened byte by byte first. Built
  // with a loop rather than String.fromCharCode(...bytes) — spreading a long
  // headline's bytes into an argument list can overflow the call stack.
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function encodeProps(props: unknown): string {
  return toBase64(JSON.stringify(props))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeProps(encoded: string): Record<string, unknown> | null {
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(b64, 'base64').toString('utf8');
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------- dotted paths */

/** Read `away.abbr` out of a props object. Used by the generated form. */
export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

/** Immutably write `away.abbr` into a props object. Used by the generated form. */
export function setPath<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const next = { ...obj } as Record<string, unknown>;
  let cursor = next;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const existing = cursor[key];
    cursor[key] = existing && typeof existing === 'object' ? { ...(existing as object) } : {};
    cursor = cursor[key] as Record<string, unknown>;
  }

  cursor[keys[keys.length - 1]] = value;
  return next as T;
}
