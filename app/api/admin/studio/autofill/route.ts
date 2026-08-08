// Content Studio — sports auto-fill.
//
// Returns the day's games for a league, each with a ready-made patch of props
// for the requested template. The editor merges a patch into the form; every
// field stays editable afterwards, so this is a head start, never an authority.
//
// Three feeds join here:
//   ESPN            — who played whom, where, when, final scores (all leagues)
//   MLB StatsAPI    — probable pitchers and their season line (baseball only)
//   The Odds API    — betting lines (key-gated; absent, odds just don't fill)
//
// Every one of them degrades to "leave the field alone" rather than failing the
// request. A studio that half-fills a form is useful; one that 500s is not.

import type { NextRequest } from 'next/server';
import { isStudioAdmin, unauthorized } from '@/lib/studio/admin-auth';
import { espnProvider } from '@/lib/studio/sports/espn';
import { probableMatchups, pitcherStatLine } from '@/lib/studio/sports/mlb-statsapi';
import { fetchOdds } from '@/lib/studio/sports/odds-api';
import { getTeam, type League } from '@/lib/studio/team-colors';
import type { GameSummary } from '@/lib/studio/sports/provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


const LEAGUES: League[] = ['mlb', 'nhl', 'nba', 'nfl'];

/**
 * Boston games, formatted for a Boston audience. The feeds return UTC; posting
 * "12:10 AM" for a 7:10 PM first pitch would be a quietly wrong graphic, which
 * is worse than an obviously broken one.
 */
const TZ = 'America/New_York';

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: TZ,
  }).format(d);
}

function formatTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TZ,
  }).format(d);
}

/** Third odds row is called something different in every sport. */
const LINE_LABEL: Record<League, string> = {
  mlb: 'Run Line',
  nhl: 'Puck Line',
  nba: 'Spread',
  nfl: 'Spread',
};

export async function GET(req: NextRequest) {
  if (!(await isStudioAdmin())) return unauthorized();

  const url = new URL(req.url);
  const league = (url.searchParams.get('league') ?? 'mlb') as League;
  const templateId = url.searchParams.get('template') ?? '';
  const dateParam = url.searchParams.get('date');

  if (!LEAGUES.includes(league)) {
    return Response.json({ error: `Unknown league: ${league}` }, { status: 400 });
  }

  // Date arrives as YYYY-MM-DD from a date input. Parsing it as local rather
  // than letting Date treat it as UTC keeps "today" meaning today in Boston.
  const date = dateParam
    ? new Date(`${dateParam}T12:00:00`)
    : new Date();
  if (Number.isNaN(date.getTime())) {
    return Response.json({ error: 'Invalid date' }, { status: 400 });
  }

  const games = await espnProvider.schedule(league, date);
  if (games.length === 0) {
    return Response.json({ games: [], note: 'No games found for that league and date.' });
  }

  const isFinalScore = templateId === 'sports-final-score';

  // Fetched once for the whole day, not per game.
  const [probables, odds] = await Promise.all([
    league === 'mlb' && !isFinalScore ? probableMatchups(date) : Promise.resolve([]),
    templateId === 'sports-gameday' ? fetchOdds(league) : Promise.resolve(null),
  ]);

  const built = await Promise.all(
    games.map(async (game: GameSummary) => {
      const away = getTeam(game.awayTeamId);
      const home = getTeam(game.homeTeamId);
      // Prefer the feed's own display names for the picker. The palette covers
      // all 124 teams, but if a feed ever returns something unmapped, showing
      // "Team @ Team" in the game list would make it unusable.
      const label = `${game.awayName ?? away.name} @ ${game.homeName ?? home.name}`;

      const patch: Record<string, unknown> = {
        awayTeam: game.awayTeamId,
        homeTeam: game.homeTeamId,
        // Venue only — the template draws its own league chip above it.
        venue: game.venue ?? '',
        dateLabel: formatDate(game.startsAt),
      };

      if (isFinalScore) {
        patch.awayScore = game.awayScore !== undefined ? String(game.awayScore) : '';
        patch.homeScore = game.homeScore !== undefined ? String(game.homeScore) : '';
        patch.statusLabel = game.status === 'final' ? 'Final' : game.status === 'in_progress' ? 'Live' : 'Scheduled';
      } else {
        patch.timeLabel = formatTime(game.startsAt);
        patch.lineLabel = LINE_LABEL[league];
      }

      // Probable pitcher → stat line. Matched on venue, because StatsAPI and
      // ESPN share no ids; near-simultaneous first pitches make start time
      // alone ambiguous. No match simply leaves statLine as the user had it.
      if (probables.length > 0 && game.venue) {
        const match = probables.find((m) => m.venue && m.venue === game.venue);
        const pitcher = match?.home ?? match?.away;
        if (pitcher) {
          const line = await pitcherStatLine(pitcher.id);
          if (line) patch.statLine = line;
        }
      }

      if (odds && game.awayName && game.homeName) {
        const line = odds.get(`${game.awayName} @ ${game.homeName}`);
        if (line) {
          if (line.moneyLineAway) patch.moneyLineAway = line.moneyLineAway;
          if (line.moneyLineHome) patch.moneyLineHome = line.moneyLineHome;
          if (line.total) patch.total = line.total;
          if (line.spreadAway) patch.runLineAway = line.spreadAway;
          if (line.spreadHome) patch.runLineHome = line.spreadHome;
        }
      }

      return {
        id: game.id,
        label,
        time: formatTime(game.startsAt),
        status: game.status,
        patch,
      };
    })
  );

  return Response.json({
    games: built,
    // Surfaced in the UI so an empty odds module reads as "no key configured"
    // rather than "the feed is broken".
    oddsAvailable: odds !== null,
  });
}
