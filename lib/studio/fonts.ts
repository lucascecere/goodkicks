// Content Studio — font loading for Satori.
//
// THE TRAP: next/font emits woff2, and Satori cannot parse woff2. The site's
// Rokkitt / Inter / Yellowtail are all next/font Google imports, so none of
// them are reachable from a render. The studio ships its own TTF copies in
// public/fonts (same families, same OFL licenses) purely for this.
//
// They are fetched off the request origin rather than read from disk with
// process.cwd(): Next's output file tracing does not reliably pull public/ into
// a serverless function bundle, and a font that works locally but 500s in
// production is the worst possible failure here. One fetch per cold start,
// cached in module scope after that.

export type StudioFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700 | 800;
  style: 'normal';
};

type FontSpec = { name: string; file: string; weight: StudioFont['weight'] };

const SPECS: FontSpec[] = [
  { name: 'Inter', file: 'Inter-Regular.ttf', weight: 400 },
  { name: 'Inter', file: 'Inter-SemiBold.ttf', weight: 600 },
  { name: 'Inter', file: 'Inter-Bold.ttf', weight: 700 },
  { name: 'Rokkitt', file: 'Rokkitt-Bold.ttf', weight: 700 },
  { name: 'Rokkitt', file: 'Rokkitt-ExtraBold.ttf', weight: 800 },
  { name: 'Yellowtail', file: 'Yellowtail-Regular.ttf', weight: 400 },
];

let cached: Promise<StudioFont[]> | null = null;

export function loadStudioFonts(origin: string): Promise<StudioFont[]> {
  if (cached) return cached;

  cached = Promise.all(
    SPECS.map(async (spec): Promise<StudioFont> => {
      const url = new URL(`/fonts/${spec.file}`, origin).toString();
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Studio font ${spec.file} failed to load (${res.status}) from ${url}`);
      }
      return {
        name: spec.name,
        data: await res.arrayBuffer(),
        weight: spec.weight,
        style: 'normal',
      };
    })
  ).catch((err) => {
    // Never cache a failure — a transient miss on cold start would otherwise
    // poison every subsequent render for the life of the instance.
    cached = null;
    throw err;
  });

  return cached;
}
