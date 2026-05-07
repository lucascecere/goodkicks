export const VARIANT_COLORS: Record<string, string> = {
  'maine':      '#5B78C0',
  'california': '#C89030',
  'montana':    '#6B9FC8',
  'new york':   '#7A1E2C',
  'new mexico': '#8BAA82',
  'tennessee':  '#D95820',
  'default':    '#6B6B6B',
};

export const VARIANT_IMAGES: Record<string, string> = {
  'maine':      '/brand/sack_maine.png',
  'california': '/brand/sack_california.png',
  'montana':    '/brand/sack_montana.png',
  'new york':   '/brand/sack_newyork.png',
  'new mexico': '/brand/sack_newmexico.png',
  'tennessee':  '/brand/sack_tennessee.png',
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
