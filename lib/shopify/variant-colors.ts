export const VARIANT_COLORS: Record<string, string> = {
  'georgia':    '#C15A3A',
  'maine':      '#5A5E68',
  'colorado':   '#5BA4B4',
  'new york':   '#A89870',
  'nevada':     '#D4A84B',
  'california': '#4A4848',
  'default':    '#6B6B6B',
};

export const VARIANT_IMAGES: Record<string, string> = {
  'maine':      '/brand/ball_maine.png',
  'new york':   '/brand/ball_newyork.png',
  'california': '/brand/ball_california.png',
};

function findStateKey(title: string, tags?: string[]): string | undefined {
  const candidates = [title, ...(tags ?? [])];
  for (const candidate of candidates) {
    const t = candidate.toLowerCase();
    const match = Object.keys(VARIANT_COLORS).find((k) => k !== 'default' && t.includes(k));
    if (match) return match;
  }
  return undefined;
}

export function colorForVariant(variantTitle: string, tags?: string[]): string {
  const key = findStateKey(variantTitle, tags);
  return key ? VARIANT_COLORS[key] : VARIANT_COLORS.default;
}

export function imageForVariant(variantTitle: string, tags?: string[]): string | undefined {
  const key = findStateKey(variantTitle, tags);
  return key ? VARIANT_IMAGES[key] : undefined;
}
