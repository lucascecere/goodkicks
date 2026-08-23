// Per-brand campaign email chrome.
//
// One map, imported by BOTH the server template that actually sends
// (app/api/admin/campaigns/[id]/send/route.ts) and the client preview
// (app/admin/campaigns/campaign-editor.tsx). Those were two hand-maintained
// copies of the same email, which is how you end up previewing one thing and
// sending another.
//
// Pure data — no process.env, no server imports — so the browser can have it.
// Colours come from app/globals.css: --color-town-navy, --color-town-forest,
// and the Good Kicks rust the campaign template already used.

import type { RealBrand } from '@/lib/admin/brand';

export type CampaignChrome = {
  /** Header bar behind the wordmark. */
  header: string;
  /** Button / link colour. */
  accent: string;
  /** Page background around the card. */
  bg: string;
  /** Text of the wordmark in the header. */
  wordmark: string;
  /** Legal-ish name for the footer. */
  name: string;
  /** Bare host for the footer line. */
  site: string;
  /** Absolute URL for links. */
  url: string;
  /** Reply-to / unsubscribe mailbox. */
  email: string;
};

export const CAMPAIGN_CHROME: Record<RealBrand, CampaignChrome> = {
  townies: {
    header: '#0D1B2A',
    accent: '#2F4F3A',
    bg: '#F2EFE8',
    wordmark: 'TOWNIES',
    name: 'Townies',
    site: 'townies.shop',
    url: 'https://townies.shop',
    // Deliberately the Good Kicks mailbox: townies.shop is not a verified
    // Resend sending domain yet, and Resend rejects unverified senders. The
    // send route resolves the real From via TOWNIES_FROM, which flips over on
    // its own once TOWNIES_FROM_EMAIL is set. See lib/email/send-rep-welcome.ts.
    email: 'info@goodkicks.co',
  },
  goodkicks: {
    header: '#C0541A',
    accent: '#C0541A',
    bg: '#F5EFE3',
    wordmark: 'good kicks.',
    name: 'Good Kicks',
    site: 'goodkicks.co',
    url: 'https://goodkicks.co',
    email: 'info@goodkicks.co',
  },
};

export function chromeFor(brand: string | null | undefined): CampaignChrome {
  return brand === 'goodkicks' ? CAMPAIGN_CHROME.goodkicks : CAMPAIGN_CHROME.townies;
}
