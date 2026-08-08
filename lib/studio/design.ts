// Content Studio — shared design system for every template.
//
// This is what stops the deck from turning into twelve one-off graphics. Type
// scale, spacing, and scrims live here; templates compose them rather than
// inventing their own numbers.
//
// Values mirror the Townies brand tokens in app/globals.css. They are repeated
// as plain strings because Satori resolves no CSS variables — it never sees the
// stylesheet, only inline styles.

/** Townies brand palette — matches `@theme` in app/globals.css exactly. */
export const BRAND = {
  navy: '#0D1B2A',
  forest: '#2F4F3A',
  cream: '#F2EFE8',
  stone: '#8F918D',
  white: '#FFFFFF',
  rule: '#E0DCD2',
  muted: '#5C6168',
} as const;

/** Font families, matching the vendored TTFs in public/fonts. */
export const FONT = {
  /** Rokkitt — the collegiate slab. Town names, headlines, structural type. */
  block: 'Rokkitt',
  /** Inter — all running text, labels, stat lines. */
  body: 'Inter',
  /** Yellowtail — brand signature moments only. Never in a headline. */
  script: 'Yellowtail',
} as const;

/**
 * Canvas padding. 1080px wide leaves room for a generous margin; Instagram
 * crops nothing at 4:5 but the feed thumbnail is small, so edges need air.
 */
export const PAD = 64;

/**
 * Type scale, in px at 1080px wide. Deliberately coarse — a small set of sizes
 * used consistently reads more designed than many sizes used once each.
 */
export const TYPE = {
  hero: 132,
  display: 96,
  title: 72,
  headline: 54,
  subhead: 40,
  body: 32,
  label: 26,
  micro: 21,
} as const;

/** Letter-spacing for the all-caps block face, which needs opening up. */
export const TRACK = {
  tight: '-0.02em',
  normal: '0',
  wide: '0.08em',
  wider: '0.16em',
  widest: '0.24em',
} as const;

/**
 * Dark scrims behind text blocks.
 *
 * Every text zone in every template sits on one of these. Background photos
 * are user-supplied and unpredictable — a bright sky behind white type is
 * unreadable, and Satori supports no backdrop-filter or blur, so a gradient is
 * the only tool available. Using it everywhere is a rule, not a preference.
 */
const SCRIM_RGB = '4, 10, 18';

export const scrim = {
  /** Anchors a bottom info bar. */
  bottom: (strength = 0.94) =>
    `linear-gradient(to top, rgba(${SCRIM_RGB}, ${strength}) 0%, rgba(${SCRIM_RGB}, ${strength * 0.82}) 38%, rgba(${SCRIM_RGB}, 0) 100%)`,
  /** Anchors a top zone (odds module, breaking-news bar). */
  top: (strength = 0.9) =>
    `linear-gradient(to bottom, rgba(${SCRIM_RGB}, ${strength}) 0%, rgba(${SCRIM_RGB}, ${strength * 0.7}) 42%, rgba(${SCRIM_RGB}, 0) 100%)`,
  /** Anchors the vertical wordmark rail down the left edge. */
  left: (strength = 0.8) =>
    `linear-gradient(to right, rgba(${SCRIM_RGB}, ${strength}) 0%, rgba(${SCRIM_RGB}, ${strength * 0.55}) 45%, rgba(${SCRIM_RGB}, 0) 100%)`,
  /** Full-bleed base wash so the photo never fights the composition. */
  base: (strength = 0.42) => `linear-gradient(to bottom, rgba(${SCRIM_RGB}, ${strength}) 0%, rgba(${SCRIM_RGB}, ${strength * 0.7}) 50%, rgba(${SCRIM_RGB}, ${strength}) 100%)`,
  /**
   * Soft horizontal band that fades in at both edges — for a text block
   * floating in the middle of the canvas, where a top or bottom scrim can't
   * reach. Without it, centered type lands on whatever the photo happens to
   * have there (a rock wall, a crowd) and stops being readable.
   */
  band: (strength = 0.68) =>
    `linear-gradient(to bottom, rgba(${SCRIM_RGB}, 0) 0%, rgba(${SCRIM_RGB}, ${strength}) 20%, rgba(${SCRIM_RGB}, ${strength}) 80%, rgba(${SCRIM_RGB}, 0) 100%)`,
  /** Solid-ish panel behind a boxed module. */
  panel: `rgba(${SCRIM_RGB}, 0.72)`,
} as const;

/** Hairline rule used inside dark modules. */
export const HAIRLINE = 'rgba(255, 255, 255, 0.16)';

/**
 * Step a font size down as text gets longer.
 *
 * Satori has no text-fitting of its own, and the content here has genuinely
 * unpredictable length — town names run "Ayer" to "Mattapoisett", headlines run
 * four words to thirty. A fixed size either strands the short ones or runs the
 * long ones off the canvas. Steps must be ordered shortest-first.
 */
export function fitText(
  text: string,
  steps: { max: number; size: number }[],
  min: number
): number {
  for (const step of steps) {
    if (text.length <= step.max) return step.size;
  }
  return min;
}

/**
 * Accent options offered by every non-sports template (sports templates take
 * their accent from the team palette instead).
 *
 * Cream leads because it's an actual Townies brand color and, being near-white,
 * holds up over anything dark once the scrim lands. Gold is kept as an option
 * but no longer the default — on brand pieces it read as a foreign color.
 * Forest is the truer brand accent but sits at roughly the same value as a dusk
 * sky and disappears — it's kept, labelled honestly.
 */
export const ACCENT_OPTIONS: { value: string; label: string }[] = [
  { value: BRAND.cream, label: 'Cream' },
  { value: '#BD3039', label: 'Red' },
  { value: '#FFB81C', label: 'Gold' },
  { value: BRAND.forest, label: 'Forest green (light photos only)' },
];

/**
 * Background photos shipped with the repo, offered in the studio's image
 * picker. Paths are relative; the render context absolutizes them.
 */
export const STOCK_BACKGROUNDS: { value: string; label: string }[] = [
  { value: '/brand/drops/milton.jpg', label: 'Milton drop' },
  { value: '/brand/drops/braintree.jpg', label: 'Braintree drop' },
  { value: '/brand/lifestyle/hero.jpg', label: 'Scituate Light' },
  { value: '/brand/lifestyle/split-harbor.jpg', label: 'Harbor' },
  { value: '/brand/lifestyle/split-foliage.jpg', label: 'Foliage' },
  { value: '/brand/lifestyle/town-hingham.jpg', label: 'Hingham' },
  { value: '/brand/lifestyle/town-scituate.jpg', label: 'Scituate' },
  { value: '/brand/lifestyle/town-cohasset.jpg', label: 'Cohasset' },
  { value: '/brand/lifestyle/town-duxbury.jpg', label: 'Duxbury' },
  { value: '/brand/lifestyle/town-weymouth.jpg', label: 'Weymouth' },
  { value: '/brand/lifestyle/town-marshfield.jpg', label: 'Marshfield' },
  { value: '/brand/lifestyle/town-norwell.jpg', label: 'Norwell' },
  { value: '/brand/lifestyle/town-hanover.jpg', label: 'Hanover' },
];
