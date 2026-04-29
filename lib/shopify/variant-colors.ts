export const VARIANT_COLORS: Record<string, string> = {
  sunset:   '#C66A3D',
  rust:     '#C66A3D',
  sky:      '#5C6F82',
  slate:    '#5C6F82',
  meadow:   '#7B8B5C',
  sage:     '#7B8B5C',
  campfire: '#1A1A1A',
  ink:      '#1A1A1A',
  cream:    '#F5EFE3',
  default:  '#6B6B6B',
};

export function colorForVariant(variantTitle: string): string {
  const key = variantTitle.toLowerCase().trim();
  return VARIANT_COLORS[key] ?? VARIANT_COLORS.default;
}
