// Content Studio — ESPN scoreboard backend.
//
// Keyless, and one response shape covers MLB, NHL, NBA and NFL, which is what
// makes it the right default: all four Boston teams from a single code path.
//
// CAVEAT, stated plainly: these endpoints are public but UNDOCUMENTED. They are
// widely used and have been stable for years, but ESPN owes nobody notice
// before changing them. That is exactly why this file sits behind the
// SportsProvider interface — if it breaks, one file gets replaced and no
// template changes.

import type { League } from '../team-colors';
import { yyyymmdd, type GameSummary, type GameStatus, type SportsProvider } from './provider';

const SPORT_PATH: Record<League, string> = {
  mlb: 'baseball/mlb',
  nhl: 'hockey/nhl',
  nba: 'basketball/nba',
  nfl: 'football/nfl',
};

/**
 * Map a vendor abbreviation onto a palette id.
 *
 * A straight lowercase join, because team-colors.ts is generated from this
 * same ESPN team list — the abbreviations are identical by construction. There
 * used to be a hand-maintained override table here; it existed only because the
 * palette was hand-written and drifted (ESPN calls the Knicks "NY", not "NYK").
 *
 * Still falls back rather than throwing: `getTeam` returns a safe placeholder,
 * and a graphic reading "TBD" beats a 500 mid-render.
 */
function toTeamId(league: League, abbr: string | undefined): string {
  if (!abbr) return `${league}-unknown`;
  return `${league}-${abbr.toLowerCase()}`;
}

function toStatus(state: string | undefined): GameStatus {
  if (state === 'in') return 'in_progress';
  if (state === 'post') return 'final';
  return 'scheduled';
}

type EspnCompetitor = {
  homeAway?: string;
  score?: string;
  team?: { abbreviation?: string; displayName?: string };
};

type EspnEvent = {
  id?: string;
  date?: string;
  competitions?: {
    venue?: { fullName?: string };
    status?: { type?: { state?: string } };
    competitors?: EspnCompetitor[];
  }[];
};

export const espnProvider: SportsProvider = {
  async schedule(league: League, date: Date): Promise<GameSummary[]> {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${SPORT_PATH[league]}/scoreboard?dates=${yyyymmdd(date)}`;

    let payload: { events?: EspnEvent[] };
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
        next: { revalidate: 300 },
      });
      if (!res.ok) return [];
      payload = (await res.json()) as { events?: EspnEvent[] };
    } catch {
      // A dead feed must never break the studio — the editor just stays on
      // whatever the user typed.
      return [];
    }

    return (payload.events ?? []).flatMap((event): GameSummary[] => {
      const competition = event.competitions?.[0];
      if (!competition) return [];

      const away = competition.competitors?.find((c) => c.homeAway === 'away');
      const home = competition.competitors?.find((c) => c.homeAway === 'home');
      if (!away || !home) return [];

      const score = (c: EspnCompetitor) => {
        const n = Number(c.score);
        return Number.isFinite(n) ? n : undefined;
      };

      return [
        {
          id: event.id ?? '',
          league,
          startsAt: event.date ?? '',
          awayTeamId: toTeamId(league, away.team?.abbreviation),
          homeTeamId: toTeamId(league, home.team?.abbreviation),
          awayName: away.team?.displayName,
          homeName: home.team?.displayName,
          venue: competition.venue?.fullName,
          status: toStatus(competition.status?.type?.state),
          awayScore: score(away),
          homeScore: score(home),
        },
      ];
    });
  },
};
