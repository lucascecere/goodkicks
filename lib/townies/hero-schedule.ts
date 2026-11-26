import { giveawayOpen } from './giveaway';
import { BLACK_FRIDAY, blackFridayOn } from './black-friday';

// The homepage hero changes on its own by date (Lucas 11-25). Every phase has
// its own photo, and none of them is used anywhere else on the homepage (the
// Milton curb and Braintree pile are already further down the page).
//
//   Nov 27 to Nov 29        Black Friday, $10 off every hat (Dorchester, spotlight)
//   until Dec 6 11:59pm ET  the town hat giveaway (Norwood gift box)
//   Dec 7 to Dec 25         Christmas (Needham by the tree; Needham has the most stock)
//   Dec 26 on               everyday brand hero (Needham on a porch rail)
//
// The homepage revalidates every 60s, so a switch lands within a minute.
// Photos are generated from the real phone photos of each hat (towns_real refs).

export type HeroContent = {
  phase: 'blackfriday' | 'giveaway' | 'christmas' | 'everyday';
  desktopSrc: string;
  mobileSrc: string;
  alt: string;
  eyebrow: string;
  headline: string;
  sub: string;
  cta: { href: string; label: string };
  ctaSecondary?: { href: string; label: string };
  focus?: string;
};

/** Last day to order in-stock for Christmas (matches the announcement bar), 11:59pm ET. */
const XMAS_ORDER_BY = Date.parse('2026-12-17T04:59:59Z');
/** Christmas hero runs through Dec 25, 11:59pm ET. */
const XMAS_END = Date.parse('2026-12-26T04:59:59Z');

export function homeHero(now = Date.now()): HeroContent {
  // Black Friday weekend beats everything (lib/townies/black-friday.ts).
  if (blackFridayOn(now)) {
    return {
      phase: 'blackfriday',
      desktopSrc: '/brand/scene/bf-dorchester-wide.jpg',
      mobileSrc: '/brand/scene/bf-dorchester-tall.jpg',
      alt: 'The Dorchester Townies hat on a slate stone under a spotlight',
      eyebrow: `Black Friday weekend · ends ${BLACK_FRIDAY.endsLabel}`,
      headline: '$10 off every hat.',
      sub: 'Hats from $19.99 through Sunday. No code needed, it comes off at checkout.',
      cta: { href: '/shop?utm_source=home&utm_campaign=black-friday', label: 'Shop the sale' },
      ctaSecondary: { href: '#towns', label: 'Find your town' },
      focus: '68% 50%',
    };
  }
  if (giveawayOpen(now)) {
    return {
      phase: 'giveaway',
      desktopSrc: '/brand/scene/giveaway-norwood-hero.jpg',
      mobileSrc: '/brand/scene/giveaway-norwood.jpg',
      alt: 'The Norwood Townies hat on a wrapped gift box',
      eyebrow: 'Giveaway · enter by Sunday, Dec 6',
      headline: 'Win your town’s hat.',
      sub: 'One free hat for every town. Pick yours and enter in ten seconds. Winners picked Monday, Dec 7.',
      cta: { href: '/giveaway?utm_source=home', label: 'Enter the giveaway' },
      ctaSecondary: { href: '/shop', label: 'Shop all towns' },
      focus: '72% 55%',
    };
  }
  if (now < XMAS_END) {
    const beforeCutoff = now < XMAS_ORDER_BY;
    return {
      phase: 'christmas',
      desktopSrc: '/brand/scene/hero-needham-xmas-wide.jpg',
      mobileSrc: '/brand/scene/hero-needham-xmas-tall.jpg',
      alt: 'The Needham Townies hat on a mantel next to wrapped gifts',
      eyebrow: beforeCutoff ? 'Christmas · order in-stock hats by Dec 16' : 'Massachusetts · Est. 2024',
      headline: 'Get your town.',
      sub: beforeCutoff
        ? 'Embroidered hats for Massachusetts towns. The gift for the one who moved away. In-stock hats ship in 1 to 3 days.'
        : 'Embroidered hats for Massachusetts towns. The zip, the year, the nickname only locals use.',
      cta: { href: '/shop', label: 'Shop all towns' },
      ctaSecondary: { href: '/gifts', label: 'Shop gifts' },
      focus: '70% 50%',
    };
  }
  return {
    phase: 'everyday',
    desktopSrc: '/brand/scene/hero-needham-porch-wide.jpg',
    mobileSrc: '/brand/scene/hero-needham-porch-tall.jpg',
    alt: 'The Needham Townies hat on a white porch railing',
    eyebrow: 'Massachusetts · Est. 2024',
    headline: 'Get your town.',
    sub: 'Embroidered hats for Massachusetts towns. The zip, the year, the nickname only locals use.',
    cta: { href: '/shop', label: 'Shop all towns' },
    ctaSecondary: { href: '#towns', label: 'Find your town' },
    focus: '60% 55%',
  };
}
