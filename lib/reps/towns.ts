// A rep isn't always one person from one town — an Instagram page run by two
// people covering two towns is still a single ambassador. `town` is stored as
// free text so that stays flexible; these helpers make the prose read right
// however many towns are in there.

/** "Milton, Weymouth" / "Milton & Weymouth" / "Milton and Weymouth" → ['Milton','Weymouth'] */
export function parseTowns(town: string | null | undefined): string[] {
  if (!town) return [];
  return town
    .split(/\s*(?:,|&|\+|\/|\band\b)\s*/i)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** ['Milton','Weymouth'] → "Milton and Weymouth"; three or more get commas. */
export function formatTownList(towns: string[]): string {
  if (towns.length === 0) return '';
  if (towns.length === 1) return towns[0];
  if (towns.length === 2) return `${towns[0]} and ${towns[1]}`;
  return `${towns.slice(0, -1).join(', ')}, and ${towns[towns.length - 1]}`;
}

/**
 * How the hat is referred to. A single-town rep gets "your Milton hat"; a rep
 * covering several towns gets a plural with no town name, since naming one
 * would be wrong and listing all of them reads like a form letter.
 */
export function hatPhrase(towns: string[]): string {
  return towns.length === 1 ? `your ${towns[0]} hat` : 'your hats';
}
