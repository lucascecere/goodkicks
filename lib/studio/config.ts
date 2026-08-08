// Content Studio — typed configuration.
//
// Follows the repo convention: env names are declared in env.d.ts, documented
// in .env.local.example, and read in exactly one place. Nothing is hardcoded
// and nothing is required — every template renders on mock data with an empty
// environment, which is the whole point of the studio being usable tonight.

export const STUDIO_CONFIG = {
  /**
   * The Odds API (the-odds-api.com). Betting lines only. Without it, odds
   * modules simply don't render — no errors, no placeholder garbage.
   */
  oddsApiKey: process.env.THE_ODDS_API_KEY ?? '',

  /**
   * Which backend answers schedule/score questions. `espn` is keyless and
   * covers all four leagues; swap when a paid provider is worth it.
   */
  sportsProvider: (process.env.STUDIO_SPORTS_PROVIDER ?? 'espn') as 'espn',
} as const;

export const hasOddsApi = (): boolean => STUDIO_CONFIG.oddsApiKey.length > 0;
