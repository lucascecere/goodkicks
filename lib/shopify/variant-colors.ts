export const VARIANT_COLORS: Record<string, string> = {
  'tennessee':  '#C15A3A',
  'maine':      '#5A5E68',
  'montana':    '#5BA4B4',
  'new york':   '#A89870',
  'new mexico': '#D4A84B',
  'california': '#4A4848',
  'default':    '#6B6B6B',
};

export const VARIANT_IMAGES: Record<string, string> = {
  'tennessee':  '/brand/ball_tennessee.png',
  'maine':      '/brand/ball_maine.png',
  'montana':    '/brand/ball_montana.png',
  'new york':   '/brand/ball_newyork.png',
  'new mexico': '/brand/ball_newmexico.png',
  'california': '/brand/ball_california.png',
};

export function colorForVariant(variantTitle: string): string {
  const key = variantTitle.toLowerCase().trim();
  return VARIANT_COLORS[key] ?? VARIANT_COLORS.default;
}

export function imageForVariant(variantTitle: string): string | undefined {
  return VARIANT_IMAGES[variantTitle.toLowerCase().trim()];
}
