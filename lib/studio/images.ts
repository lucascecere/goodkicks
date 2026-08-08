// Content Studio — image resolution for Satori.
//
// Two problems, one solution.
//
// 1. Satori has no page context, so a relative `/brand/lifestyle/hero.jpg`
//    resolves to nothing and renders blank.
// 2. Satori fetches remote images itself and THROWS if one fails — a flaky
//    team-logo CDN would take down the entire graphic, not just the logo.
//
// So every image referenced in props is pre-fetched here, inlined as a data
// URI, and handed to the template already resolved. A failed fetch becomes
// `undefined`, which templates are required to handle with a fallback.

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;

/** Does this string look like something we should try to load as an image? */
function looksLikeImage(value: string): boolean {
  if (value.startsWith('http://') || value.startsWith('https://')) return true;
  return value.startsWith('/') && IMAGE_EXT.test(value.split('?')[0]);
}

/**
 * Walk a props object for image references. Generic on purpose — templates
 * shouldn't have to declare which of their fields are images just so the
 * renderer can pre-load them.
 */
export function collectImageRefs(value: unknown, found = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    if (looksLikeImage(value)) found.add(value);
    return found;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectImageRefs(item, found);
    return found;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectImageRefs(item, found);
  }
  return found;
}

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
};

function mimeFor(url: string, headerType: string | null): string {
  if (headerType && headerType.startsWith('image/')) return headerType;
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return MIME[ext] ?? 'image/png';
}

/** SVG is accepted by Satori only as a data URI, and never as a background. */
async function fetchAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0) return null;
    return `data:${mimeFor(url, res.headers.get('content-type'))};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

/**
 * Pre-resolve every image in `props` into data URIs.
 *
 * Returns a lookup keyed by the ORIGINAL reference, so templates keep using the
 * paths they were given and never think about origins or encoding.
 */
export async function resolveImages(
  props: unknown,
  origin: string,
  /** Extra references a template reaches indirectly, e.g. team logos. */
  extraRefs: (string | undefined)[] = []
): Promise<Map<string, string>> {
  const found = collectImageRefs(props);
  for (const ref of extraRefs) {
    if (ref) found.add(ref);
  }
  const refs = [...found];
  const resolved = new Map<string, string>();

  await Promise.all(
    refs.map(async (ref) => {
      const absolute = ref.startsWith('/') ? new URL(ref, origin).toString() : ref;
      const dataUri = await fetchAsDataUri(absolute);
      if (dataUri) resolved.set(ref, dataUri);
    })
  );

  return resolved;
}

/** Build the `img` helper handed to templates via RenderContext. */
export function makeImgResolver(resolved: Map<string, string>) {
  return (src: string | undefined | null): string | undefined => {
    if (!src) return undefined;
    return resolved.get(src);
  };
}
