// Short, checkable local facts for the /custom-hats/<town> pages.
//
// Every field here has to be the kind of thing a local could confirm from the
// town's own website or a road sign: county, the year it became a town (or the
// year a Boston neighbourhood was annexed), its zip codes, and one well-known
// landmark or nickname. If a fact is not certain, the field is left out rather
// than guessed. A wrong founding year on a page about someone's hometown is the
// fastest way to lose them.

export type TownFact = {
  /** Display name, used when the catalogue is empty and the page falls back. */
  name: string;
  county: string;
  /** e.g. "Incorporated 1640" or "Part of Boston since 1874". */
  founded?: string;
  zips: string[];
  /** One sentence. A landmark or a nickname locals actually use. */
  note?: string;
};

export const TOWN_FACTS: Record<string, TownFact> = {
  braintree: {
    name: 'Braintree',
    county: 'Norfolk County',
    founded: 'Incorporated 1640',
    zips: ['02184'],
    note: 'Home of the South Shore Plaza, and the town that Quincy was carved out of in 1792.',
  },
  brighton: {
    name: 'Brighton',
    county: 'Suffolk County',
    founded: 'Split from Cambridge in 1807, part of Boston since 1874',
    zips: ['02135'],
  },
  dorchester: {
    name: 'Dorchester',
    county: 'Suffolk County',
    founded: 'Founded 1630, part of Boston since 1870',
    zips: ['02121', '02122', '02124', '02125'],
    note: 'Dot to anyone from there, and home of the JFK Presidential Library on Columbia Point.',
  },
  hingham: {
    name: 'Hingham',
    county: 'Plymouth County',
    founded: 'Incorporated 1635',
    zips: ['02043'],
    note: 'Home of the Old Ship Church, built in 1681.',
  },
  'hyde-park': {
    name: 'Hyde Park',
    county: 'Suffolk County',
    founded: 'Incorporated 1868, part of Boston since 1912',
    zips: ['02136'],
    note: 'The last town Boston annexed.',
  },
  milton: {
    name: 'Milton',
    county: 'Norfolk County',
    founded: 'Settled 1640, incorporated 1662',
    zips: ['02186'],
    note: 'Under the Great Blue Hill.',
  },
  norwood: {
    name: 'Norwood',
    county: 'Norfolk County',
    founded: 'Incorporated 1872',
    zips: ['02062'],
  },
  quincy: {
    name: 'Quincy',
    county: 'Norfolk County',
    founded: 'Incorporated 1792',
    zips: ['02169', '02170', '02171'],
    note: 'The City of Presidents, birthplace of John Adams and John Quincy Adams.',
  },
  roslindale: {
    name: 'Roslindale',
    county: 'Suffolk County',
    founded: 'Part of Boston since 1874',
    zips: ['02131'],
  },
  sandwich: {
    name: 'Sandwich',
    county: 'Barnstable County',
    founded: 'Incorporated 1639',
    zips: ['02563'],
    note: 'The oldest town on Cape Cod.',
  },
  walpole: {
    name: 'Walpole',
    county: 'Norfolk County',
    founded: 'Incorporated 1724',
    zips: ['02081'],
  },
  'west-roxbury': {
    name: 'West Roxbury',
    county: 'Suffolk County',
    founded: 'Split from Roxbury in 1851, part of Boston since 1874',
    zips: ['02132'],
    note: 'Where Brook Farm stood in the 1840s.',
  },
  weymouth: {
    name: 'Weymouth',
    county: 'Norfolk County',
    founded: 'Settled 1622, incorporated 1635',
    zips: ['02188', '02189', '02190', '02191'],
    note: 'Birthplace of Abigail Adams.',
  },
};

/**
 * The towns live on townies.shop as of October 2026. Used when the catalogue
 * cannot be read (local dev, a Shopify outage at build), so the custom pages
 * still build. Titletown is a Boston theme, not a town, and is left out.
 */
export const LIVE_TOWN_SLUGS = [
  'braintree', 'brighton', 'dorchester', 'hingham', 'hyde-park', 'milton', 'norwood',
  'quincy', 'roslindale', 'sandwich', 'walpole', 'west-roxbury', 'weymouth',
] as const;

/** Catalogue entries that are not towns, so get no custom-hats page. */
export const NOT_A_TOWN = new Set(['titletown']);
