export const VARIANT_COLORS: Record<string, string> = {
  'maine':      '#5B78C0',
  'massachusetts': '#C89030',
  'montana':    '#6B9FC8',
  'new york':   '#7A1E2C',
  'new mexico': '#8BAA82',
  'tennessee':  '#D95820',
  'default':    '#6B6B6B',
};

// With-background versions — used on shop cards and product detail pages
export const VARIANT_IMAGES: Record<string, string> = {
  'maine':         '/products/blue-white-bg.jpg',
  'massachusetts': '/products/blue-yellow-bg.jpg',
  'montana':       '/products/blue-red-bg.jpg',
  'new york':      '/products/black-red-bg.jpg',
  'new mexico':    '/products/tan-green-bg.jpg',
  'tennessee':     '/products/orange-gray-bg.jpg',
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
