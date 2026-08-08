// Content Studio — The Odds API (the-odds-api.com).
//
// The one piece of the data layer that needs a paid key. Without
// THE_ODDS_API_KEY every function here returns null, and the gameday template's
// odds module just stays switched off — no errors, no placeholder numbers that
// could be mistaken for real lines.

import type { League } from '../team-colors';
import { STUDIO_CONFIG, hasOddsApi } from '../config';
import { formatAmerican, type OddsLine } from './provider';

const SPORT_KEY: Record<League, string> = {
  mlb: 'baseball_mlb',
  nhl: 'icehockey_nhl',
  nba: 'basketball_nba',
  nfl: 'americanfootball_nfl',
};

type Outcome = { name?: string; price?: number; point?: number };
type Market = { key?: string; outcomes?: Outcome[] };
type Bookmaker = { key?: string; markets?: Market[] };
type Event = {
  id?: string;
  home_team?: string;
  away_team?: string;
  commence_time?: string;
  bookmakers?: Bookmaker[];
};

/**
 * Odds for every upcoming game in a league, keyed by "Away Team @ Home Team"
 * using the API's own full team names.
 *
 * Matching on names rather than ids is a deliberate limitation of the scaffold:
 * The Odds API has no shared id space with ESPN or MLB StatsAPI, so the join
 * has to happen on names anyway. Phase 2 wires the actual reconciliation.
 */
export async function fetchOdds(league: League): Promise<Map<string, OddsLine> | null> {
  if (!hasOddsApi()) return null;

  const params = new URLSearchParams({
    apiKey: STUDIO_CONFIG.oddsApiKey,
    regions: 'us',
    markets: 'h2h,spreads,totals',
    oddsFormat: 'american',
  });
  const url = `https://api.the-odds-api.com/v4/sports/${SPORT_KEY[league]}/odds?${params}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000), next: { revalidate: 600 } });
    if (!res.ok) return null;
    const events = (await res.json()) as Event[];

    const out = new Map<string, OddsLine>();

    for (const event of events) {
      if (!event.home_team || !event.away_team) continue;

      // First bookmaker is good enough for a graphic; we're not shopping lines.
      const markets = event.bookmakers?.[0]?.markets ?? [];
      const find = (key: string) => markets.find((m) => m.key === key)?.outcomes ?? [];

      const h2h = find('h2h');
      const spreads = find('spreads');
      const totals = find('totals');

      const over = totals.find((o) => o.name === 'Over');

      out.set(`${event.away_team} @ ${event.home_team}`, {
        moneyLineAway: formatAmerican(h2h.find((o) => o.name === event.away_team)?.price),
        moneyLineHome: formatAmerican(h2h.find((o) => o.name === event.home_team)?.price),
        total: over?.point !== undefined ? `O/U ${over.point}` : undefined,
        spreadAway: formatAmerican(spreads.find((o) => o.name === event.away_team)?.point),
        spreadHome: formatAmerican(spreads.find((o) => o.name === event.home_team)?.point),
      });
    }

    return out;
  } catch {
    return null;
  }
}
