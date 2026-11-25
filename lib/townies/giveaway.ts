// Town hat giveaway (Dec 2026): one free hat per town, one winner per town.
// Entries come from the /giveaway form (this table) and from Instagram comments
// on the giveaway post. Change the dates here and the page + API follow.

export const GIVEAWAY = {
  campaign: 'town-hats-2026-12',
  /** Entries close Sunday Dec 6, 11:59pm Eastern. */
  closesAt: '2026-12-07T04:59:59Z',
  pickLabel: 'Monday, Dec 7',
} as const;

export function giveawayOpen(now = Date.now()): boolean {
  return now < Date.parse(GIVEAWAY.closesAt);
}

export const OTHER_TOWN = 'other';

/** Live towns that are NOT part of this giveaway (Lucas 11-25: Canton and
 *  Westwood launched after the post; Charlestown is in). */
export const GIVEAWAY_EXCLUDED = new Set(['canton', 'westwood']);

export function giveawayEligible(slug: string): boolean {
  return !GIVEAWAY_EXCLUDED.has(slug);
}

/** localStorage key for the site popup's snooze. */
export const GIVEAWAY_POPUP_KEY = 'townies_giveaway_popup_v1';

/** True while the giveaway popup still wants to show (open + not snoozed). */
export function giveawayPopupPending(): boolean {
  if (!giveawayOpen()) return false;
  try {
    const raw = localStorage.getItem(GIVEAWAY_POPUP_KEY);
    return !raw || (JSON.parse(raw).until ?? 0) < Date.now();
  } catch {
    return false;
  }
}
