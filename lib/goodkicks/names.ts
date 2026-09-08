// Good Kicks product titles in Shopify carry the brand as a prefix —
// "Good Kicks — Montana", "Good Kicks Pro — The 8Ball" (and, historically,
// "The Good Kick — Maine"). On a Good Kicks page the brand is the page, so a
// card or a PDP shows just the colorway.

const PREFIX = /^(?:the\s+)?good\s+kicks?(?:\s+pro)?\s*[—–-]\s*/i;

export function gkDisplayName(title: string): string {
  const stripped = title.replace(PREFIX, '').trim();
  return stripped || title;
}

/**
 * Good Kicks ships from stock, always. The Shopify descriptions still carry a
 * "Preorder now — ships in 2-3 weeks" line from the V1 launch, and the site
 * must not repeat it. Drops any sentence that mentions pre-ordering; the rest
 * of the description renders as written.
 */
export function gkDescriptionHtml(html: string): string {
  return html
    .replace(/<p>[^<]*pre-?order[^<]*<\/p>/gi, '')
    .replace(/[^.<>]*\bpre-?order\b[^.<>]*\.\s*/gi, '');
}

/** "Good Kicks Pro" for the Pro line, else "Good Kicks". */
export function gkLine(title: string): string {
  return /good\s+kicks?\s+pro/i.test(title) ? 'Good Kicks Pro' : 'Good Kicks';
}
