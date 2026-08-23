// Final Score — the post-game counterpart to Gameday.
//
// Same skeleton as Gameday (left rail, center matchup, bottom bar) so the two
// read as a pair in the feed, but the scores are the hero and the winning side
// is emphasised: the losing score drops to a muted grey. Reusing the layout is
// the point — a follower should recognise a Townies Nation sports post before
// they read a word of it.

import { z } from 'zod';
import {
  Background,
  BrandFooter,
  Label,
  Scrim,
  TeamMark,
  VerticalWordmark,
} from '@/components/studio/primitives';
import { CANVAS, defineTemplate, type FieldDef } from '@/lib/studio/types';
import { FONT, PAD, TRACK, TYPE, scrim } from '@/lib/studio/design';
import { getTeam, LEAGUE_LABELS } from '@/lib/studio/team-colors';

const schema = z.object({
  wordmark: z.string(),
  awayTeam: z.string(),
  homeTeam: z.string(),
  awayScore: z.string(),
  homeScore: z.string(),
  /** "Final", "Final/10", "Final/OT" — leagues disagree, so it's free text. */
  statusLabel: z.string(),
  background: z.string(),
  venue: z.string(),
  dateLabel: z.string(),
  statLine: z.string(),
});

type Props = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { key: 'wordmark', label: 'Left rail wordmark', type: 'text', group: 'Layout' },
  { key: 'background', label: 'Background photo', type: 'image', group: 'Layout' },

  { key: 'league', label: 'League', type: 'league', group: 'Result', help: 'Scopes the team lists and tags the graphic.' },
  { key: 'awayTeam', label: 'Away team', type: 'team', group: 'Result' },
  { key: 'awayScore', label: 'Away score', type: 'text', group: 'Result' },
  { key: 'homeTeam', label: 'Home team', type: 'team', group: 'Result', help: 'Home team colors drive the wordmark and accents.' },
  { key: 'homeScore', label: 'Home score', type: 'text', group: 'Result' },
  { key: 'statusLabel', label: 'Status', type: 'text', group: 'Result', placeholder: 'Final / Final/10 / Final/OT' },
  { key: 'venue', label: 'Venue / league line', type: 'text', group: 'Result' },

  { key: 'dateLabel', label: 'Date', type: 'text', group: 'Bottom bar' },
  { key: 'statLine', label: 'Stat line', type: 'text', group: 'Bottom bar', help: 'The performance worth naming. Gets its own line.' },
];

const mock: Props = {
  wordmark: 'FINAL',
  awayTeam: 'mlb-nyy',
  homeTeam: 'mlb-bos',
  awayScore: '3',
  homeScore: '7',
  statusLabel: 'Final',
  background: '/brand/scene/milton-21x9.jpg',
  venue: 'MLB · Fenway Park',
  dateLabel: 'Tuesday, August 5',
  statLine: 'Ceddanne Rafaela 3-4, 2 HR, 5 RBI',
};

const BOTTOM_BAR = 300;
const RAIL_GUTTER = 200;

/** Blank or non-numeric scores shouldn't decide a winner. */
function winner(away: string, home: string): 'away' | 'home' | null {
  const a = Number(away);
  const h = Number(home);
  if (!Number.isFinite(a) || !Number.isFinite(h) || a === h) return null;
  return a > h ? 'away' : 'home';
}

function ScoreSide({
  logo,
  abbr,
  name,
  primary,
  onPrimary,
  score,
  dimmed,
}: {
  logo?: string;
  abbr: string;
  name: string;
  primary: string;
  onPrimary: string;
  score: string;
  dimmed: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 330 }}>
      <TeamMark logo={logo} abbr={abbr} primary={primary} onPrimary={onPrimary} size={150} />
      <div
        style={{
          display: 'flex',
          fontFamily: FONT.block,
          fontWeight: 800,
          fontSize: 34,
          color: dimmed ? 'rgba(255,255,255,0.55)' : '#FFFFFF',
          letterSpacing: TRACK.tight,
          textTransform: 'uppercase',
          marginTop: 18,
        }}
      >
        {name}
      </div>
      <div
        style={{
          display: 'flex',
          fontFamily: FONT.block,
          fontWeight: 800,
          fontSize: 148,
          lineHeight: 1,
          letterSpacing: TRACK.tight,
          color: dimmed ? 'rgba(255,255,255,0.5)' : '#FFFFFF',
          marginTop: 10,
        }}
      >
        {score}
      </div>
    </div>
  );
}

export const finalScoreTemplate = defineTemplate<Props>({
  id: 'sports-final-score',
  name: 'Final Score',
  category: 'sports',
  description: 'Post-game result with the winning side emphasised.',
  canvas: CANVAS.portrait,
  schema,
  fields,
  mock,

  imageRefs: (p) => [getTeam(p.awayTeam).logoUrl, getTeam(p.homeTeam).logoUrl],

  autofillKind: 'sports',

  caption: (p) => {
    const away = getTeam(p.awayTeam);
    const home = getTeam(p.homeTeam);
    return [
      `${p.statusLabel.toUpperCase()}: ${away.name} ${p.awayScore}, ${home.name} ${p.homeScore}`,
      '',
      p.statLine,
      `${p.dateLabel} · ${p.venue}`,
      '',
      '#TowniesNation #Boston #Massachusetts',
    ].join('\n');
  },

  render: (p, ctx) => {
    const away = getTeam(p.awayTeam);
    const home = getTeam(p.homeTeam);
    const accent = home.secondary;
    const won = winner(p.awayScore, p.homeScore);

    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: CANVAS.portrait.width,
          height: CANVAS.portrait.height,
          backgroundColor: '#040A12',
        }}
      >
        <Background
          image={ctx.img(p.background)}
          baseScrim={scrim.base(0.5)}
          width={CANVAS.portrait.width}
          height={CANVAS.portrait.height}
        />
        <Scrim image={scrim.left(0.8)} top={0} left={0} width={400} height={CANVAS.portrait.height} />
        {/* Starts high enough to catch the venue label, which sits above the
            logos and would otherwise land on open photo. */}
        <Scrim image={scrim.band(0.7)} top={230} left={0} width={CANVAS.portrait.width} height={700} />
        <Scrim image={scrim.bottom(0.95)} bottom={0} left={0} width={CANVAS.portrait.width} height={470} />

        <div
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            top: 0,
            left: PAD,
            height: CANVAS.portrait.height - BOTTOM_BAR,
          }}
        >
          <VerticalWordmark text={p.wordmark} color={accent} accent={accent} size={82} />
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            paddingLeft: RAIL_GUTTER,
            paddingRight: PAD,
            paddingTop: PAD,
            paddingBottom: BOTTOM_BAR,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* League tag — gives each sport a distinct marker on the graphic. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${accent}`,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 6,
              paddingBottom: 6,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 19,
                letterSpacing: TRACK.wider,
                color: accent,
              }}
            >
              {LEAGUE_LABELS[home.league]}
            </div>
          </div>

          <Label size={22} color={accent} track={TRACK.widest}>
            {p.venue}
          </Label>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 34,
            }}
          >
            <ScoreSide
              logo={ctx.img(away.logoUrl)}
              abbr={away.abbr}
              name={away.name}
              primary={away.primary}
              onPrimary={away.onPrimary}
              score={p.awayScore}
              dimmed={won === 'home'}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: 70,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 2,
                  height: 150,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                }}
              />
            </div>
            <ScoreSide
              logo={ctx.img(home.logoUrl)}
              abbr={home.abbr}
              name={home.name}
              primary={home.primary}
              onPrimary={home.onPrimary}
              score={p.homeScore}
              dimmed={won === 'away'}
            />
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 40,
              paddingLeft: 30,
              paddingRight: 30,
              paddingTop: 12,
              paddingBottom: 12,
              backgroundColor: accent,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 26,
                letterSpacing: TRACK.wider,
                textTransform: 'uppercase',
                color: home.league === 'nhl' ? '#000000' : '#FFFFFF',
              }}
            >
              {p.statusLabel}
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            bottom: 0,
            left: 0,
            width: CANVAS.portrait.width,
            paddingLeft: PAD,
            paddingRight: PAD,
            paddingTop: 44,
            paddingBottom: 52,
          }}
        >
          <Label size={24} color="#FFFFFF" track={TRACK.wider}>
            {p.dateLabel}
          </Label>
          <div
            style={{
              display: 'flex',
              height: 2,
              width: '100%',
              backgroundColor: accent,
              opacity: 0.85,
              marginTop: 24,
              marginBottom: 24,
            }}
          />
          {/* Hidden when empty rather than rendering a blank row: MLB only
              publishes probable pitchers a few days out, so batch-generated
              posts for next week legitimately have no stat line yet. */}
          {p.statLine ? (
            <div
              style={{
                display: 'flex',
                fontFamily: FONT.body,
                fontWeight: 600,
                fontSize: TYPE.subhead,
                lineHeight: 1.25,
                color: '#FFFFFF',
              }}
            >
              {p.statLine}
            </div>
          ) : null}
          <div style={{ display: 'flex', marginTop: 28 }}>
            <BrandFooter mark={ctx.brandMark} />
          </div>
        </div>
      </div>
    );
  },
});
