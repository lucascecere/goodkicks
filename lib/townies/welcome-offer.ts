// The first-order code pair from the pop-up, kept in this browser so the bag
// can apply both at checkout without anyone typing a code.

const KEY = 'townies_offer_codes';

export type SavedOffer = { codes: string[]; expiresAt: string | null };

export function saveOffer(offer: SavedOffer) {
  try {
    localStorage.setItem(KEY, JSON.stringify(offer));
  } catch {}
}

/** The saved codes, or [] when there are none or they've expired. */
export function readOfferCodes(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const offer = JSON.parse(raw) as SavedOffer;
    if (offer.expiresAt && Date.parse(offer.expiresAt) < Date.now()) return [];
    return Array.isArray(offer.codes) ? offer.codes.filter((c) => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

/** The pop-up's own snooze record: { until, reason }. */
export const OFFER_POPUP_KEY = 'townies_offer_popup_v1';

/** True once the offer pop-up has been claimed or closed in this browser, so
 *  other pop-ups (Hat & Sack on /shop) can wait their turn. */
export function offerPopupSettled(): boolean {
  try {
    return localStorage.getItem(OFFER_POPUP_KEY) !== null;
  } catch {
    return true;
  }
}
