// Town Spotlight — the town-as-hero post.
//
// Straight out of the brand rule in docs/brand-guidelines.md: the town is the
// hero, Townies is the label. So the town name is the largest thing on the
// canvas, the facts sit underneath as a small structured block, and the brand
// signs the bottom quietly.

import { z } from 'zod';
import { Background, BrandFooter, Label, Scrim } from '@/components/studio/primitives';
import { CANVAS, defineTemplate, type FieldDef } from '@/lib/studio/types';
import { ACCENT_OPTIONS, FONT, HAIRLINE, PAD, TRACK, fitText, scrim } from '@/lib/studio/design';

const schema = z.object({
  eyebrow: z.string(),
  town: z.string(),
  region: z.string(),
  blurb: z.string(),
  fact1Label: z.string(),
  fact1Value: z.string(),
  fact2Label: z.string(),
  fact2Value: z.string(),
  fact3Label: z.string(),
  fact3Value: z.string(),
  background: z.string(),
  accent: z.string(),
});

type Props = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { key: 'eyebrow', label: 'Eyebrow', type: 'text', group: 'Town', placeholder: 'Town spotlight' },
  { key: 'town', label: 'Town', type: 'text', group: 'Town', help: 'The hero. Sized to fill the width.' },
  { key: 'region', label: 'Region', type: 'text', group: 'Town', placeholder: 'South Shore' },
  { key: 'blurb', label: 'Blurb', type: 'textarea', rows: 3, group: 'Town' },

  { key: 'fact1Label', label: 'Fact 1 — label', type: 'text', group: 'Facts' },
  { key: 'fact1Value', label: 'Fact 1 — value', type: 'text', group: 'Facts' },
  { key: 'fact2Label', label: 'Fact 2 — label', type: 'text', group: 'Facts' },
  { key: 'fact2Value', label: 'Fact 2 — value', type: 'text', group: 'Facts' },
  { key: 'fact3Label', label: 'Fact 3 — label', type: 'text', group: 'Facts', help: 'Leave the label blank to hide a row.' },
  { key: 'fact3Value', label: 'Fact 3 — value', type: 'text', group: 'Facts' },

  { key: 'background', label: 'Background photo', type: 'image', group: 'Look' },
  { key: 'accent', label: 'Accent', type: 'select', group: 'Look', options: ACCENT_OPTIONS },
];

const mock: Props = {
  eyebrow: 'Town spotlight',
  town: 'Scituate',
  region: 'South Shore',
  blurb: 'The most Irish town in America, a working harbor, and a lighthouse that has been talking people home since 1811.',
  fact1Label: 'Settled',
  fact1Value: '1627',
  fact2Label: 'Population',
  fact2Value: '18,842',
  fact3Label: 'Known for',
  fact3Value: 'Scituate Light',
  // NOT town-scituate.jpg — that file is a scanned vintage postcard with
  // printed caption text across the top, which collides with the eyebrow.
  // hero.jpg is Scituate Light, so this stays coherent and stays clean.
  background: '/brand/lifestyle/hero.jpg',
  accent: '#F2EFE8',
};

const TOWN_STEPS = [
  { max: 6, size: 176 },
  { max: 9, size: 148 },
  { max: 12, size: 120 },
  { max: 16, size: 98 },
];

function FactRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          height: 1,
          width: '100%',
          backgroundColor: HAIRLINE,
          marginBottom: 16,
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 16,
        }}
      >
        <Label size={22} color={accent} track={TRACK.widest}>
          {label}
        </Label>
        <div
          style={{
            display: 'flex',
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 34,
            color: '#FFFFFF',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export const townSpotlightTemplate = defineTemplate<Props>({
  id: 'town-spotlight',
  name: 'Town Spotlight',
  category: 'town',
  description: 'Town as hero, with a short blurb and three facts.',
  canvas: CANVAS.portrait,
  schema,
  fields,
  mock,

  caption: (p) =>
    [
      `${p.town.toUpperCase()} — ${p.region}`,
      '',
      p.blurb,
      '',
      [p.fact1Label && `${p.fact1Label}: ${p.fact1Value}`, p.fact2Label && `${p.fact2Label}: ${p.fact2Value}`, p.fact3Label && `${p.fact3Label}: ${p.fact3Value}`]
        .filter(Boolean)
        .join(' · '),
      '',
      `#TowniesNation #${p.town.replace(/\s+/g, '')} #Massachusetts`,
    ]
      .filter(Boolean)
      .join('\n'),

  render: (p, ctx) => (
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
      <Scrim image={scrim.top(0.6)} top={0} left={0} width={CANVAS.portrait.width} height={280} />
      <Scrim image={scrim.bottom(0.96)} bottom={0} left={0} width={CANVAS.portrait.width} height={900} />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: PAD,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Label size={26} color={p.accent} track={TRACK.widest}>
            {p.eyebrow}
          </Label>
          <div style={{ display: 'flex', width: 88, height: 4, backgroundColor: p.accent, marginTop: 18 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end' }}>
          <Label size={24} color="rgba(255,255,255,0.7)" track={TRACK.widest}>
            {p.region}
          </Label>

          <div
            style={{
              display: 'flex',
              fontFamily: FONT.block,
              fontWeight: 800,
              fontSize: fitText(p.town, TOWN_STEPS, 82),
              lineHeight: 0.94,
              letterSpacing: TRACK.tight,
              textTransform: 'uppercase',
              color: '#FFFFFF',
              marginTop: 12,
            }}
          >
            {p.town}
          </div>

          {p.blurb ? (
            <div
              style={{
                display: 'flex',
                fontFamily: FONT.body,
                fontWeight: 400,
                fontSize: 34,
                lineHeight: 1.45,
                color: 'rgba(255,255,255,0.86)',
                marginTop: 26,
                maxWidth: 860,
              }}
            >
              {p.blurb}
            </div>
          ) : null}

          {/* Blank label hides the row — three facts is the design, but not
              every town has three worth printing. */}
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 40 }}>
            {p.fact1Label ? <FactRow label={p.fact1Label} value={p.fact1Value} accent={p.accent} /> : null}
            {p.fact2Label ? <FactRow label={p.fact2Label} value={p.fact2Value} accent={p.accent} /> : null}
            {p.fact3Label ? <FactRow label={p.fact3Label} value={p.fact3Value} accent={p.accent} /> : null}
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: 36 }}>
          <BrandFooter mark={ctx.brandMark} />
        </div>
      </div>
    </div>
  ),
});
