// How a rep is addressed and how their code is built.
//
// A rep is not always one person. An Instagram page run by two people is a
// single ambassador, so "first name" logic that blindly takes the first word
// turns "South Shore Guys" into "hey South".

/**
 * What to call them in an email. One or two words is treated as a personal
 * name and shortened to the first ("Alex Smith" → "Alex"); anything longer is
 * treated as a page or duo name and kept whole ("South Shore Guys").
 */
export function greetingName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'there';
  return words.length <= 2 ? words[0] : name.trim();
}

/** Strip anything that can't appear in a Shopify discount code. */
export function slugifyCode(input: string): string {
  return input
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export type CodeSuggestion = { label: string; code: string };

/**
 * Candidate codes, best first. The rep's identity (their handle, then their
 * name) leads: a code is about who they are, and a page covering two towns has
 * no single town to name. Town is offered last for single-town reps.
 */
export function codeSuggestions({
  instagram,
  name,
  towns,
  discountPct,
}: {
  instagram?: string | null;
  name?: string | null;
  towns: string[];
  discountPct: number;
}): CodeSuggestion[] {
  const seen = new Set<string>();
  const out: CodeSuggestion[] = [];

  const add = (label: string, source: string | null | undefined) => {
    if (!source) return;
    const slug = slugifyCode(source);
    if (!slug) return;
    const code = `${slug}${discountPct}`;
    if (seen.has(code)) return;
    seen.add(code);
    out.push({ label, code });
  };

  add('handle', instagram);
  add('name', name);
  // Only when there's exactly one town — "MILTONWEYMOUTH15" helps nobody.
  if (towns.length === 1) add('town', towns[0]);

  return out;
}
