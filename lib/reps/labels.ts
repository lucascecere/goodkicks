// The rep vocabulary: account types, follower ranges, and the field labels that
// differ between the two programs.
//
// These lists existed in five places — the public application form, the admin
// edit dropdown, and three hand-written value→label display maps — and they had
// already drifted apart. When the Townies form gained `athlete-college`,
// `athlete-pro` and `athlete-local`, none of the display copies learned about
// them, so:
//   • the roster and the rep detail page rendered the raw slug ("athlete-pro")
//   • the edit dropdown could not represent the rep's actual value, so opening
//     and saving their profile silently reassigned their account type
//   • the detail page had NO Townies types at all, only the Good Kicks four
//
// So the option lists below are the source, and the label maps are DERIVED from
// them. Adding an option to the form now updates every surface at once, which
// is the only version of this that stays correct.

import type { RealBrand } from '@/lib/admin/brand';

export type Option = { value: string; label: string };

export const GK_ACCOUNT_TYPES: Option[] = [
  { value: 'high-school', label: 'High School' },
  { value: 'college', label: 'College' },
  { value: 'freestyle', label: 'Freestyle' },
  { value: 'general', label: 'General' },
];

// College and pro athletes are their own options rather than one "local
// athlete" bucket, because they are the answer that overrides the follower bar:
// they get approved on the strength of the sport at any audience size. Buried
// inside a general athlete option, that signal arrives unreadable.
export const TOWNIES_ACCOUNT_TYPES: Option[] = [
  { value: 'town-page', label: 'Town / local page' },
  // "influencer" is in the label because it is the word this group uses for
  // itself; "hometown creator" alone reads as something smaller than it is.
  { value: 'creator', label: 'Content creator / influencer' },
  { value: 'athlete-college', label: 'College athlete' },
  { value: 'athlete-pro', label: 'Pro / semi-pro athlete' },
  { value: 'athlete-local', label: 'Local / high school athlete' },
  { value: 'other', label: 'Something else' },
  // Retired: the pre-2026-08 Townies form offered a single 'athlete'. Kept so
  // existing rows still render as words rather than a slug. Not offered to new
  // applicants — see accountTypesFor().
  { value: 'athlete', label: 'Local athlete' },
];

/** Options a NEW applicant may pick. Excludes retired values. */
const RETIRED = new Set(['athlete']);

export function accountTypesFor(brand: RealBrand): Option[] {
  const all = brand === 'townies' ? TOWNIES_ACCOUNT_TYPES : GK_ACCOUNT_TYPES;
  return all.filter((o) => !RETIRED.has(o.value));
}

export const FOLLOWER_RANGES: Option[] = [
  { value: 'under-500', label: 'Under 500' },
  { value: '500-2k', label: '500–2k' },
  { value: '2k-10k', label: '2k–10k' },
  { value: '10k+', label: '10k+' },
];

function toMap(options: Option[]): Record<string, string> {
  return Object.fromEntries(options.map((o) => [o.value, o.label]));
}

/** Every account type across both brands — display only, so no brand needed. */
export const ACCOUNT_TYPE_LABELS = toMap([...GK_ACCOUNT_TYPES, ...TOWNIES_ACCOUNT_TYPES]);
export const FOLLOWER_LABELS = toMap(FOLLOWER_RANGES);

/** Render a stored value, falling back to the raw string rather than blank. */
export function accountTypeLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return ACCOUNT_TYPE_LABELS[value] ?? value;
}

export function followerLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return FOLLOWER_LABELS[value] ?? value;
}

/**
 * The two programs name the same slots differently: a Townies rep reps a town
 * and wants a hat; a Good Kicks ambassador reps a school and wants a colorway.
 * Written out per-file before, which is how 'Hat wanted' and 'Hat Wanted' ended
 * up on two screens describing one field.
 */
export function repFieldLabels(brand: RealBrand) {
  const isTownies = brand === 'townies';
  return {
    place: isTownies ? 'Town' : 'School / Group',
    placePlural: isTownies ? 'Town(s)' : 'School / Group',
    preference: isTownies ? 'Hat wanted' : 'Colorway',
    roleNoun: isTownies ? 'Town Rep' : 'Ambassador',
    roleNounPlural: isTownies ? 'Town Reps' : 'Ambassadors',
  };
}
