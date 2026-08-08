// Gameday — the flagship sports template.
//
// Fixed zones: a vertical wordmark down the left rail in team colors, an
// optional betting-odds module, a center logo + matchup box, and a bottom info
// bar carrying date, time, and a stat line.
//
// Everything else is swappable: background photo, both team palettes, matchup,
// odds values, stat line. Nothing about "Red Sox" is baked in — the Sox are
// simply the default in `mock`.

import { z } from 'zod';
import {
  Background,
  BrandFooter,
  Label,
  Rule,
  Scrim,
  TeamMark,
  VerticalWordmark,
} from '@/components/studio/primitives';
import { CANVAS, defineTemplate, type FieldDef } from '@/lib/studio/types';
import { FONT, PAD, STOCK_BACKGROUNDS, TRACK, TYPE, scrim } from '@/lib/studio/design';
import { getTeam, teamOptions, LEAGUE_LABELS } from '@/lib/studio/team-colors';

const schema = z.object({
  wordmark: z.string(),
  awayTeam: z.string(),
  homeTeam: z.string(),
  background: z.string(),
  venue: z.string(),
  dateLabel: z.string(),
  timeLabel: z.string(),
  statLine: z.string(),
  showOdds: z.boolean(),
  oddsHeading: z.string(),
  moneyLineAway: z.string(),
  moneyLineHome: z.string(),
  total: z.string(),
  /** "Run Line" for baseball, "Puck Line" for hockey, "Spread" for the rest. */
  lineLabel: z.string(),
  runLineAway: z.string(),
  runLineHome: z.string(),
});

type Props = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { key: 'wordmark', label: 'Left rail wordmark', type: 'text', group: 'Layout', help: 'Runs vertically down the left edge.' },
  { key: 'background', label: 'Background photo', type: 'image', group: 'Layout' },

  { key: 'league', label: 'League', type: 'league', group: 'Matchup', help: 'Scopes the team lists, sets the odds line label, and tags the graphic.' },
  { key: 'awayTeam', label: 'Away team', type: 'team', group: 'Matchup' },
  { key: 'homeTeam', label: 'Home team', type: 'team', group: 'Matchup', help: 'Home team colors drive the wordmark and accents.' },
  { key: 'venue', label: 'Venue / league line', type: 'text', group: 'Matchup', placeholder: 'MLB · Fenway Park' },

  { key: 'dateLabel', label: 'Date', type: 'text', group: 'Bottom bar', placeholder: 'Tuesday, August 5' },
  { key: 'timeLabel', label: 'First pitch', type: 'text', group: 'Bottom bar', placeholder: '7:10 PM' },
  { key: 'statLine', label: 'Stat line', type: 'text', group: 'Bottom bar', help: 'Gets its own line — pitcher record, ERA, strikeouts.' },

  { key: 'showOdds', label: 'Show odds module', type: 'toggle', group: 'Odds' },
  { key: 'oddsHeading', label: 'Odds heading', type: 'text', group: 'Odds' },
  { key: 'moneyLineAway', label: 'Money line — away', type: 'text', group: 'Odds' },
  { key: 'moneyLineHome', label: 'Money line — home', type: 'text', group: 'Odds' },
  { key: 'total', label: 'Total (O/U)', type: 'text', group: 'Odds' },
  { key: 'lineLabel', label: 'Third row label', type: 'select', group: 'Odds', options: [
    { value: 'Run Line', label: 'Run Line (MLB)' },
    { value: 'Puck Line', label: 'Puck Line (NHL)' },
    { value: 'Spread', label: 'Spread (NBA / NFL)' },
  ] },
  { key: 'runLineAway', label: 'Line — away', type: 'text', group: 'Odds' },
  { key: 'runLineHome', label: 'Line — home', type: 'text', group: 'Odds' },
];

const mock: Props = {
  wordmark: 'GAMEDAY',
  awayTeam: 'mlb-nyy',
  homeTeam: 'mlb-bos',
  background: '/brand/lifestyle/hero.jpg',
  venue: 'MLB · Fenway Park',
  dateLabel: 'Tuesday, August 5',
  timeLabel: '7:10 PM',
  statLine: 'Sonny Gray 13-2, 2.93 ERA, 98 K',
  showOdds: true,
  oddsHeading: 'Betting Line',
  moneyLineAway: '+122',
  moneyLineHome: '-145',
  total: 'O/U 8.5',
  lineLabel: 'Run Line',
  runLineAway: '+1.5',
  runLineHome: '-1.5',
};

/** Reserved height for the bottom bar, so the matchup centers in what's left. */
const BOTTOM_BAR = 312;
/** Width of the left rail plus its breathing room. */
const RAIL_GUTTER = 200;

function OddsRow({
  label,
  away,
  home,
  single,
}: {
  label: string;
  away?: string;
  home?: string;
  single?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 13,
        paddingBottom: 13,
      }}
    >
      <Label size={20} color="rgba(255,255,255,0.55)">
        {label}
      </Label>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        {single ? (
          <div style={{ display: 'flex', fontFamily: FONT.body, fontWeight: 700, fontSize: 28, color: '#FFFFFF' }}>
            {single}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', fontFamily: FONT.body, fontWeight: 700, fontSize: 28, color: '#FFFFFF' }}>
              {away}
            </div>
            <div
              style={{
                display: 'flex',
                fontFamily: FONT.body,
                fontWeight: 400,
                fontSize: 24,
                color: 'rgba(255,255,255,0.38)',
                paddingLeft: 12,
                paddingRight: 12,
              }}
            >
              /
            </div>
            <div style={{ display: 'flex', fontFamily: FONT.body, fontWeight: 700, fontSize: 28, color: '#FFFFFF' }}>
              {home}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TeamColumn({
  logo,
  abbr,
  city,
  name,
  primary,
  onPrimary,
}: {
  logo?: string;
  abbr: string;
  city: string;
  name: string;
  primary: string;
  onPrimary: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 290 }}>
      <TeamMark logo={logo} abbr={abbr} primary={primary} onPrimary={onPrimary} size={196} />
      <div
        style={{
          display: 'flex',
          fontFamily: FONT.block,
          fontWeight: 800,
          fontSize: 42,
          color: '#FFFFFF',
          letterSpacing: TRACK.tight,
          textTransform: 'uppercase',
          marginTop: 22,
          textAlign: 'center',
        }}
      >
        {name}
      </div>
      {/* Hidden when it repeats the name — ESPN lists the Athletics' location
          as "Athletics", which printed the word twice. */}
      {city && city.toLowerCase() !== name.toLowerCase() ? (
        <Label size={19} color="rgba(255,255,255,0.5)">
          {city}
        </Label>
      ) : null}
    </div>
  );
}

export const gamedayTemplate = defineTemplate<Props>({
  id: 'sports-gameday',
  name: 'Gameday',
  category: 'sports',
  description: 'Matchup announcement with optional betting lines and a stat line.',
  canvas: CANVAS.portrait,
  schema,
  fields,
  mock,

  // Logos are reached through the palette, not carried in props, so the
  // renderer has to be told about them or they'd never be pre-fetched.
  imageRefs: (p) => [getTeam(p.awayTeam).logoUrl, getTeam(p.homeTeam).logoUrl],

  autofillKind: 'sports',

  caption: (p) => {
    const away = getTeam(p.awayTeam);
    const home = getTeam(p.homeTeam);
    return [
      `${away.name.toUpperCase()} @ ${home.name.toUpperCase()}`,
      '',
      `${p.dateLabel} · ${p.timeLabel}`,
      p.venue,
      p.statLine,
      '',
      '#TowniesNation #Boston #Massachusetts',
    ].join('\n');
  },

  render: (p, ctx) => {
    const away = getTeam(p.awayTeam);
    const home = getTeam(p.homeTeam);

    // The home team owns the palette — it's their building, their crowd.
    const railColor = home.secondary;
    const accent = home.secondary;

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
          baseScrim={scrim.base(0.46)}
          width={CANVAS.portrait.width}
          height={CANVAS.portrait.height}
        />

        {/* Zone scrims. Each text block gets its own so legibility never
            depends on which photo the user picked. Sizes are numeric, not
            percentages — see the note on Background. */}
        <Scrim image={scrim.left(0.82)} top={0} left={0} width={420} height={CANVAS.portrait.height} />
        {p.showOdds ? (
          <Scrim image={scrim.top(0.72)} top={0} left={0} width={CANVAS.portrait.width} height={480} />
        ) : null}
        {/* Behind the matchup block, which floats mid-canvas where the top and
            bottom scrims don't reach. Tracks the matchup: with the odds module
            hidden the block recenters upward, and a scrim pinned to the
            odds-on position would leave the venue label uncovered. */}
        <Scrim
          image={scrim.band(0.66)}
          top={p.showOdds ? 430 : 285}
          left={0}
          width={CANVAS.portrait.width}
          height={580}
        />
        <Scrim image={scrim.bottom(0.95)} bottom={0} left={0} width={CANVAS.portrait.width} height={560} />

        {/* Left rail — vertically centered in the space above the bottom bar. */}
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
          <VerticalWordmark text={p.wordmark} color={railColor} accent={accent} size={78} />
        </div>

        {/* Main column, clearing the rail. */}
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
          }}
        >
          {/* Odds module — optional, top right. */}
          {p.showOdds ? (
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: 452,
                  padding: 30,
                  backgroundColor: 'rgba(4, 10, 18, 0.78)',
                  borderLeft: `6px solid ${accent}`,
                }}
              >
                <Label size={22} color={accent}>
                  {p.oddsHeading}
                </Label>
                <Rule margin={14} />
                <OddsRow label="Money Line" away={p.moneyLineAway} home={p.moneyLineHome} />
                <Rule margin={0} />
                <OddsRow label="Total" single={p.total} />
                <Rule margin={0} />
                <OddsRow label={p.lineLabel} away={p.runLineAway} home={p.runLineHome} />
              </div>
            </div>
          ) : null}

          {/* Matchup box — centered in whatever vertical space is left, so the
              composition rebalances when the odds module is switched off. */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
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
              <TeamColumn
                logo={ctx.img(away.logoUrl)}
                abbr={away.abbr}
                city={away.city}
                name={away.name}
                primary={away.primary}
                onPrimary={away.onPrimary}
              />

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 96,
                  paddingBottom: 58,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontFamily: FONT.block,
                    fontWeight: 700,
                    fontSize: 56,
                    color: 'rgba(255,255,255,0.42)',
                  }}
                >
                  @
                </div>
              </div>

              <TeamColumn
                logo={ctx.img(home.logoUrl)}
                abbr={home.abbr}
                city={home.city}
                name={home.name}
                primary={home.primary}
                onPrimary={home.onPrimary}
              />
            </div>
          </div>
        </div>

        {/* Bottom info bar — full bleed, deliberately roomy. The stat line gets
            its own line rather than being crammed next to the time. */}
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Label size={24} color="#FFFFFF" track={TRACK.wider}>
              {p.dateLabel}
            </Label>
            <div
              style={{
                display: 'flex',
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: accent,
                marginLeft: 20,
                marginRight: 20,
              }}
            />
            <Label size={24} color="#FFFFFF" track={TRACK.wider}>
              {p.timeLabel}
            </Label>
          </div>

          <div
            style={{
              display: 'flex',
              height: 2,
              width: '100%',
              backgroundColor: accent,
              opacity: 0.85,
              marginTop: 26,
              marginBottom: 26,
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

          <div style={{ display: 'flex', marginTop: 30 }}>
            <BrandFooter />
          </div>
        </div>
      </div>
    );
  },
});

/** Re-exported so the studio's image picker can offer the shipped photos. */
export const gamedayBackgrounds = STOCK_BACKGROUNDS;
/** Re-exported for the team picker. */
export const gamedayTeamOptions = teamOptions;
