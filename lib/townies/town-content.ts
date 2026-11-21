/**
 * Written content for each /towns/<slug> page, keyed by town slug.
 *
 * The town pages used to be a masthead and a product grid: about 200 words, most
 * of them navigation. Someone searching "needham ma hat" or "gift for someone
 * from dorchester" landed on a page with nothing on it about Needham or
 * Dorchester. This is that missing part: what is stitched on the hat, what the
 * marks mean, and a line about the place.
 *
 * Rules for this file (so it stays trustworthy):
 * - Describe only what is on the real hat (check the Shopify photos).
 * - A mark's meaning goes in `why` only when it is verified. If we don't know
 *   why a mark is there, describe it and say nothing about the reason.
 * - No em dashes, no "rep your roots", no invented local lore.
 * - A town with no entry here still gets a page; it just shows the generic copy.
 */

export type TownContent = {
  /** <title> override (the template appends "| Townies"). */
  seoTitle?: string;
  /** Meta description override, ≤ 155 chars. */
  seoDescription?: string;
  /** What's on the front panel. */
  front: string;
  /** What's on the side panel. */
  side: string;
  /** Crown / brim / button colours. */
  colours: string;
  /** Verified meaning of the marks, if any. */
  why?: string;
  /** One or two paragraphs about the town and who the hat is for. */
  about: string[];
  /** Local nickname, for reference. */
  nickname?: string;
  /** Place name for the shipping/gift FAQ when the hat isn't named for a town (Titletown → Boston). */
  placeName?: string;
};

export const TOWN_CONTENT: Record<string, TownContent> = {
  needham: {
    seoTitle: 'Needham, MA Hat | Embroidered Town Hat',
    seoDescription:
      'The Needham hat: NEEDHAM in gold on a cream two-tone, the Rocket and 1711 on the side. Embroidered, designed in Massachusetts.',
    front: 'NEEDHAM arched across the front in vegas gold satin stitch with a thin navy outline.',
    side: 'A navy rocket with 1711 in gold along its body and a gold flame trailing behind it.',
    colours: 'Cream crown, navy brim, navy button.',
    why:
      'The rocket is for the Needham High Rockets, the mascot the school took on in the 1950s. 1711 is the year Needham was incorporated as its own town.',
    about: [
      'Needham is the kind of town people stay loyal to long after they move out of it. Thanksgiving morning against Wellesley, a coffee in Needham Center, the Rockets on a Friday night. The hat is for anyone who grew up in Needham or lives there now.',
      'It is a good one to give, too, especially to someone from Needham who lives somewhere else now.',
    ],
  },

  dorchester: {
    seoTitle: 'Dorchester Hat | Embroidered Dot Hat with the Rainbow Swash',
    seoDescription:
      'The Dorchester hat: DORCHESTER in red, the Rainbow Swash and 1630 on the side. Embroidered on a cream two-tone. Made for Dot.',
    front: 'DORCHESTER arched across the front in red satin stitch with a navy outline.',
    side: 'The rainbow stripes from the Dorchester gas tank, with 1630 stitched underneath.',
    colours: 'Cream crown, navy brim, navy button.',
    why:
      'The stripes are Corita Kent\'s Rainbow Swash, painted on the gas tank at Commercial Point in 1971 and the first thing a lot of people picture when they think of Dot. 1630 is the year Dorchester was settled, a few months before Boston.',
    about: [
      'Dorchester is the biggest neighborhood in Boston and probably the proudest. Savin Hill, Adams Village, Fields Corner, Lower Mills, Neponset: whichever part of Dot you are from, you are from Dot first.',
      'A lot of these go out to people who grew up in Dorchester and live somewhere else now. If that is who you are buying for, it lands.',
    ],
    nickname: 'Dot',
  },

  milton: {
    seoTitle: 'Milton, MA Hat | Embroidered Town Hat with the Wildcat Paw',
    seoDescription:
      'The Milton hat: MILTON in red on a cream two-tone, a red paw on the side for the Wildcats. Embroidered, designed in Massachusetts.',
    front: 'MILTON arched across the front in red satin stitch with a black outline.',
    side: 'A red paw print with a black outline.',
    colours: 'Cream crown, black brim, black button.',
    why: 'The paw is for the Milton High Wildcats, who wear red and white.',
    about: [
      'Milton was one of the first Townies hats. The town sits between the Blue Hills and the Neponset, right on the line with Boston, and people from Milton will tell you it is nothing like either side of that line.',
      'Whether you went to Milton High, grew up on the hill, or just moved to town and want something that says so, this is the one.',
    ],
  },

  norwood: {
    seoTitle: 'Norwood, MA Hat | Embroidered Town Hat with the Mustang',
    seoDescription:
      'The Norwood hat: NORWOOD in navy and gold on a cream two-tone, the Mustang on the side. Embroidered, designed in Massachusetts.',
    front: 'NORWOOD arched across the front in navy satin stitch with a gold outline.',
    side: 'A navy and gold mustang at full gallop.',
    colours: 'Cream crown, navy brim, navy button.',
    why: 'The mustang is for the Norwood High Mustangs, who play in blue and gold.',
    about: [
      'Norwood has a downtown people actually use, a Route 1 everyone in Norfolk County has driven, and a lot of people who never really left. The colours on this hat are the Mustangs\' colours, so it fits right in at a game.',
      'It also works for anyone who grew up in Norwood and wants a little of it wherever they ended up.',
    ],
  },

  'hyde-park': {
    seoTitle: 'Hyde Park, MA Hat | Embroidered Boston Neighborhood Hat',
    seoDescription:
      'The Hyde Park hat: HYDE PARK in maroon and gold on a cream two-tone, an eagle on the side. Embroidered, designed in Massachusetts.',
    front: 'HYDE PARK arched across the front in maroon satin stitch with a gold outline.',
    side: 'A maroon and gold eagle with its wings up.',
    colours: 'Cream crown, black brim, black button.',
    about: [
      'Hyde Park was its own town until 1912, when it became the last town Boston annexed, and plenty of people there still talk about it that way. Cleary Square, Readville, Fairmount Hill, the Neponset running through it: it is Boston, but it is Hyde Park first.',
      'This one is for anyone from HP, whether you still live off River Street or you moved away years ago and miss it.',
    ],
    nickname: 'HP',
  },

  quincy: {
    seoTitle: 'Quincy, MA Hat | Embroidered City Hat with the 02169 Patch',
    seoDescription:
      'The Quincy hat: QUINCY in red on a cream two-tone, a WELCOME TO 02169 / 1625 patch on the side. Embroidered, designed in Massachusetts.',
    front: 'QUINCY arched across the front in red satin stitch with a black outline.',
    side: 'A navy oval patch reading WELCOME TO 02169, with 1625 underneath.',
    colours: 'Cream crown, black brim, black button.',
    why:
      '02169 is Quincy\'s main ZIP code. 1625 is the year Captain Wollaston\'s group settled Mount Wollaston, the first English settlement in what is now Quincy.',
    about: [
      'Quincy is the City of Presidents, home to Wollaston Beach and Marina Bay. Wollaston, North Quincy, Squantum, Houghs Neck, West Quincy: everyone has their part of it.',
      'The 02169 patch is the detail people notice first. It makes a good gift for anyone who grew up in Quincy and has been gone a while.',
    ],
  },

  brighton: {
    seoTitle: 'Brighton, MA Hat | Embroidered Boston Neighborhood Hat',
    seoDescription:
      'The Brighton hat: Brighton in orange script on a cream two-tone, 02135 on the side. Embroidered, designed in Massachusetts.',
    front: 'Brighton in an orange script with a black outline, running across the front.',
    side: '02135 stitched down the side panel in orange with a black outline.',
    colours: 'Cream crown, navy brim, navy button.',
    why: '02135 is Brighton\'s ZIP code.',
    about: [
      'Brighton gets lumped in with Allston, but anyone who has lived near Oak Square, Brighton Center or Cleveland Circle knows it is its own place. Lots of people pass through it for school, and a lot of them end up staying.',
      'The script is a little different from our collegiate hats, on purpose. It is for people who live in Brighton now and for everyone who spent a few good years there.',
    ],
  },

  roslindale: {
    seoTitle: 'Roslindale Hat | Embroidered Rozzie Hat, 02131',
    seoDescription:
      'The Roslindale hat: a green R in a circle on a cream two-tone, 02131 MASS on the side. Embroidered, designed in Massachusetts.',
    front: 'A green Old English R inside a green circle, centred on the front.',
    side: '02131 over MASS, in green.',
    colours: 'Cream crown, black brim, black button.',
    why: '02131 is Roslindale\'s ZIP code.',
    about: [
      'Roslindale Village, the Arboretum on one side, the bakeries and the farmers market in the square. Rozzie is one of the best neighborhoods in Boston, and the people who live there will tell you so.',
      'This one is quieter than the rest of the lineup: just the R on the front and the ZIP on the side. People from Rozzie get it right away.',
    ],
    nickname: 'Rozzie',
  },

  'west-roxbury': {
    seoTitle: 'West Roxbury Hat | Embroidered Westie Hat, 02132',
    seoDescription:
      'The West Roxbury hat: WESTIE across a green shamrock, a WELCOME TO 02132 patch on the side. Embroidered, designed in Massachusetts.',
    front: 'WESTIE arched straight across a large green shamrock, the letters overlapping the leaves.',
    side: 'A black oval patch reading WELCOME TO 02132, CITY OF BOSTON.',
    colours: 'Cream crown, black brim, black button.',
    why: '02132 is West Roxbury\'s ZIP code, and Westie is what everyone from there calls it.',
    about: [
      'Centre Street, the VFW Parkway, Millennium Park: West Roxbury is the corner of Boston that feels most like a town. Nobody from there calls it West Roxbury in conversation. It is Westie.',
      'It goes to people who still live there, people who grew up there, and people buying for a parent who never left.',
    ],
    nickname: 'Westie',
  },

  walpole: {
    seoTitle: 'Walpole, MA Hat | Embroidered Town Hat',
    seoDescription:
      'The Walpole hat: WALPOLE in orange and navy on a cream two-tone, crossed sabers on the side. Embroidered, designed in Massachusetts.',
    front: 'WALPOLE arched across the front in orange satin stitch with a navy outline.',
    side: 'Two crossed sabers with navy blades, an orange outline and orange hilts.',
    colours: 'Cream crown, navy brim, navy button.',
    about: [
      'Walpole is a small town that shows up for its own. Friday night games, the Common at Christmas, Route 1A through the middle of it all.',
      'The orange and navy make this one of the brightest hats we do. It is for anyone from Walpole, East Walpole or South Walpole, wherever they live now.',
    ],
  },

  weymouth: {
    seoTitle: 'Weymouth, MA Hat | Embroidered Town Hat, Est. 1635',
    seoDescription:
      'The Weymouth hat: WEYMOUTH in gold and maroon on a cream two-tone, an EST. 1635 patch on the side. Embroidered, designed in Massachusetts.',
    front: 'WEYMOUTH arched across the front in gold satin stitch with a maroon outline.',
    side: 'An arched gold and maroon patch marked EST. 1635.',
    colours: 'Cream crown, black brim, black button.',
    why:
      'Weymouth was settled as Wessagusset in 1622 and incorporated as Weymouth in 1635, which makes it one of the oldest towns in Massachusetts.',
    about: [
      'North Weymouth, South Weymouth, Jackson Square, Wessagusset Beach, the Wildcats: Weymouth is a big town that still feels like a small one when you are from it.',
      'It is for anyone from Weymouth, whether you still live there or moved away.',
    ],
  },

  sandwich: {
    seoTitle: 'Sandwich, MA Hat | Embroidered Cape Cod Town Hat',
    seoDescription:
      'The Sandwich hat: SANDWICH inside a navy shark on a cream two-tone, a wave on the side. Embroidered, designed in Massachusetts.',
    front: 'SANDWICH lettered inside the outline of a navy shark, swimming across the front.',
    side: 'A navy wave.',
    colours: 'Cream crown, navy brim, navy button.',
    why: 'Sandwich was settled in 1637 and incorporated in 1639, which makes it the oldest town on Cape Cod.',
    about: [
      'Sandwich is the oldest town on the Cape: the boardwalk, Town Neck Beach, the canal, the village center. People who summer there love it about as much as the people who live there all year.',
      'It is a good hat for the beach and an easy gift for anyone with a Cape house or a Cape childhood.',
    ],
  },

  titletown: {
    seoTitle: 'Titletown Hat | Embroidered Boston Championship Banners Hat',
    seoDescription:
      'The Titletown hat: four banners for Boston\'s 18, 9, 6 and 6 titles and an Entering Boston patch, on a black unstructured hat.',
    front: 'TITLETOWN in white across a two-peaked outline, with four small banners underneath reading 18, 9, 6 and 6.',
    side: 'A patch made to look like the Entering Boston road sign, with a green shamrock.',
    colours: 'Solid black hat, black strap.',
    placeName: 'Boston',
    why:
      'The banners are the championship counts: 18 for the Celtics, 9 for the Red Sox, 6 for the Patriots and 6 for the Bruins.',
    about: [
      'This is the one hat in the lineup that is not about a single town. It is for anyone who grew up with Boston sports, which around here is everyone.',
      'It is our Everyday style: solid black, unstructured and low profile, so it sits a little lower than the two-tone town hats.',
    ],
  },

  braintree: {
    seoTitle: 'Braintree, MA Hat | Embroidered Town Hat',
    seoDescription:
      'The Braintree hat: BRAINTREE in royal blue on a cream two-tone, a blue crest on the side. Embroidered, designed in Massachusetts.',
    front: 'BRAINTREE arched across the front in royal blue satin stitch with a black outline.',
    side: 'A royal blue crest with a B.',
    colours: 'Cream crown, black brim, black button.',
    why: 'Braintree was incorporated in 1640. Quincy and Randolph were both part of it once.',
    about: [
      'Braintree is the crossroads of the South Shore: the Plaza, the split, the Red Line\'s last stop. It is also one of the oldest towns around, and the people from there are not shy about it.',
      'It was one of the original South Shore hats, and the royal blue makes it stand out. It is for anyone who grew up in Braintree, whether you still live there or not.',
    ],
  },
};

export function townContent(slug: string): TownContent | null {
  return TOWN_CONTENT[slug] ?? null;
}
