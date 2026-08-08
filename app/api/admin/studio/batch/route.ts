// Content Studio — "generate the week".
//
// The batch-creation payoff: pick a league and a team, get a scheduled draft
// for every game in the next N days, each already filled from the live feed and
// each still fully editable. This is the difference between the studio saving
// ten minutes and saving an evening.
//
// Drafts, never auto-posted — the point is to have the week's slate ready to
// review, not to publish unattended.

import type { NextRequest } from 'next/server';
import { isStudioAdmin, unauthorized } from '@/lib/studio/admin-auth';
import { espnProvider } from '@/lib/studio/sports/espn';
import { probableMatchups, pitcherStatLine } from '@/lib/studio/sports/mlb-statsapi';
import { fetchOdds } from '@/lib/studio/sports/odds-api';
import { createPosts, type PostInput } from '@/lib/studio/posts';
import { getTemplate } from '@/lib/studio/registry';
import { parseProps } from '@/lib/studio/params';
import { getTeam, type League } from '@/lib/studio/team-colors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LEAGUES: League[] = ['mlb', 'nhl', 'nba', 'nfl'];
const TZ = 'America/New_York';
const MAX_DAYS = 14;

function formatDate(iso: string): string {
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
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TZ,
  }).format(d);
}

const LINE_LABEL: Record<League, string> = {
  mlb: 'Run Line',
  nhl: 'Puck Line',
  nba: 'Spread',
  nfl: 'Spread',
};

export async function POST(req: NextRequest) {
  if (!(await isStudioAdmin())) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }

  const league = body.league as League;
  if (!LEAGUES.includes(league)) {
    return Response.json({ error: `Unknown league: ${body.league}` }, { status: 400 });
  }

  const templateId = typeof body.templateId === 'string' ? body.templateId : 'sports-gameday';
  const template = getTemplate(templateId);
  if (!template) {
    return Response.json({ error: `Unknown template: ${templateId}` }, { status: 400 });
  }

  const days = Math.min(Math.max(Number(body.days) || 7, 1), MAX_DAYS);
  /** Optional palette id — omit to take every game in the league. */
  const teamId = typeof body.teamId === 'string' && body.teamId ? body.teamId : null;

  // One request per day: the scoreboard endpoint is per-date. Sequential rather
  // than parallel to stay a polite client of an undocumented public API.
  const start = new Date();
  const inputs: PostInput[] = [];

  // Odds for the whole league, once. Null when THE_ODDS_API_KEY is unset — in
  // which case the odds module is switched OFF per post rather than inheriting
  // the template's mock numbers. Shipping invented betting lines is far worse
  // than shipping none.
  const odds = templateId === 'sports-gameday' ? await fetchOdds(league) : null;

  for (let offset = 0; offset < days; offset++) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);

    const games = await espnProvider.schedule(league, date);

    // Probable pitchers for this date, fetched once per day rather than per
    // game. Without this the stat line falls through to the template's mock,
    // and every generated post would claim Sonny Gray is starting.
    const probables = league === 'mlb' ? await probableMatchups(date) : [];

    for (const game of games) {
      if (teamId && game.awayTeamId !== teamId && game.homeTeamId !== teamId) continue;

      const away = getTeam(game.awayTeamId);
      const home = getTeam(game.homeTeamId);

      const patch: Record<string, unknown> = {
        awayTeam: game.awayTeamId,
        homeTeam: game.homeTeamId,
        // Venue only — the template draws its own league chip above this, so
        // prefixing the league here printed "MLB" twice.
        venue: game.venue ?? '',
        dateLabel: formatDate(game.startsAt),
        timeLabel: formatTime(game.startsAt),
        lineLabel: LINE_LABEL[league],
        // Explicitly blank so parseProps cannot fall back to the mock's
        // placeholder. A missing stat line is an empty row; an inherited one is
        // a published lie.
        statLine: '',
        // Same reasoning, higher stakes: off unless real odds are found below.
        showOdds: false,
      };

      if (odds && game.awayName && game.homeName) {
        const line = odds.get(`${game.awayName} @ ${game.homeName}`);
        if (line?.moneyLineAway && line.moneyLineHome) {
          patch.showOdds = true;
          patch.moneyLineAway = line.moneyLineAway;
          patch.moneyLineHome = line.moneyLineHome;
          if (line.total) patch.total = line.total;
          if (line.spreadAway) patch.runLineAway = line.spreadAway;
          if (line.spreadHome) patch.runLineHome = line.spreadHome;
        }
      }

      if (probables.length > 0 && game.venue) {
        const match = probables.find((m) => m.venue && m.venue === game.venue);
        const pitcher = match?.home ?? match?.away;
        if (pitcher) {
          const line = await pitcherStatLine(pitcher.id);
          if (line) patch.statLine = line;
        }
      }

      // Merged over the template's mock so untouched fields (wordmark, photo,
      // odds heading) keep sane defaults rather than arriving blank.
      const props = parseProps(template, patch);

      inputs.push({
        template_id: template.id,
        title: `${away.name} @ ${home.name}`,
        status: 'draft',
        // Scheduled at first pitch. Moving it is one field in the editor, and
        // an approximately-right date beats an empty calendar.
        scheduled_for: game.startsAt || null,
        props: props as Record<string, unknown>,
        caption: template.caption?.(props) ?? '',
      });
    }
  }

  if (inputs.length === 0) {
    return Response.json({
      created: 0,
      note: teamId
        ? 'No games for that team in the window.'
        : 'No games found in that window — probably an off-season date.',
    });
  }

  try {
    const posts = await createPosts(inputs);
    return Response.json({ created: posts.length });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Could not create posts' },
      { status: 500 }
    );
  }
}
