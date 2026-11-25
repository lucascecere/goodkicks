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
