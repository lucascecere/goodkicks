/**
 * The blanks Townies actually buys, in the colourways they actually come in
 * (Lucas, 2026-10-07: "we're buying pre-made blanks, these colorways aren't
 * all possible"). The custom-hat builder offers ONLY these. Add a colourway
 * here when you stock it; nothing else in the builder needs to change.
 *
 * Starting set = the colourways already on live Townies hats:
 * - Lifestyle (Weld Two-Tone Workhorse): Natural crown with a Black brim
 *   (Milton, Braintree, Quincy…) or a Navy brim (Walpole, Dorchester).
 * - Everyday (Yupoong 6502): Black (Milton 02186, Hingham 02043), Navy (the
 *   archived Braintree 02184).
 * Weld's own list (Java, Black, Cactus, Rust, Slate Blue, Cactus Dune, Dune
 * Black, Hunter-Navy, Navy, Hunter, Sun, Jam, Canyon, Pompeii, Moonstone) is
 * what's orderable from them; add one once it's confirmed and its two
 * colours are known.
 */
export type Colorway = { name: string; crown: string; brim: string };

export const BLANK_COLORWAYS: Record<'lifestyle' | 'everyday', Colorway[]> = {
  lifestyle: [
    { name: 'Natural / Black', crown: '#EDE6D6', brim: '#1F1F1F' },
    { name: 'Natural / Navy', crown: '#EDE6D6', brim: '#1B2433' },
  ],
  everyday: [
    { name: 'Black', crown: '#1F1F1F', brim: '#1F1F1F' },
    { name: 'Navy', crown: '#1B2433', brim: '#1B2433' },
  ],
};
