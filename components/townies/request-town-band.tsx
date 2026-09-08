import { ClosingBand } from './closing-band';

/**
 * Closing CTA — forest green over the pine pattern.
 *
 * The single most useful thing a visitor who doesn't find their town can do is
 * tell us it's missing, so the page ends on that. Pine (not MA) because every
 * other band on the homepage is already carrying the MA pattern, and four
 * identical grounds read as one long page.
 */
export function RequestTownBand() {
  return (
    <ClosingBand
      eyebrow="Don’t see your town?"
      title="Tell us where you’re from."
      body="Towns get made because people ask for them. Put yours in — if enough people from the same place raise their hand, it goes into the queue."
      cta={{ href: '/request-a-town', label: 'Request your town' }}
      secondary={{ href: '/shop', label: 'see what’s live' }}
      pattern="pine"
    />
  );
}
