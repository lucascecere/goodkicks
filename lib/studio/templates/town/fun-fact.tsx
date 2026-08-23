// Fun Fact — the other end of the spectrum from Gameday.
//
// Hand-typed, no API, square canvas. It exists in Phase 1 on purpose: building
// the registry against one dense API-fed portrait layout AND one simple manual
// square layout is what proves the abstraction actually holds, rather than
// being a gameday renderer wearing a registry costume.

import { z } from 'zod';
import { Background, BrandFooter, Label, Scrim } from '@/components/studio/primitives';
import { CANVAS, defineTemplate, type FieldDef } from '@/lib/studio/types';
import { ACCENT_OPTIONS, FONT, TRACK, fitText, scrim } from '@/lib/studio/design';

const schema = z.object({
  eyebrow: z.string(),
  town: z.string(),
  fact: z.string(),
  source: z.string(),
  background: z.string(),
  accent: z.string(),
});

type Props = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { key: 'eyebrow', label: 'Eyebrow', type: 'text', group: 'Content', placeholder: 'Did you know' },
  { key: 'town', label: 'Town', type: 'text', group: 'Content', help: 'The hero. Sized to fill the width.' },
  { key: 'fact', label: 'The fact', type: 'textarea', rows: 4, group: 'Content', help: 'Two or three lines reads best. Long text shrinks automatically.' },
  { key: 'source', label: 'Source / credit', type: 'text', group: 'Content', placeholder: 'Optional' },
  { key: 'background', label: 'Background photo', type: 'image', group: 'Look' },
  { key: 'accent', label: 'Accent', type: 'select', group: 'Look', options: ACCENT_OPTIONS },
];

const mock: Props = {
  eyebrow: 'Did you know',
  // Town matched to the photo on purpose — see the note in news/headline.
  town: 'Weymouth',
  fact: 'Settled in 1622, Weymouth is the second-oldest town in Massachusetts — older than Boston, and beaten only by Plymouth.',
  source: '',
  background: '/brand/scene/clover-2-1x1.jpg',
  accent: '#F2EFE8',
};

const TOWN_STEPS = [
  { max: 6, size: 168 },
  { max: 9, size: 140 },
  { max: 12, size: 112 },
  { max: 16, size: 92 },
];

const FACT_STEPS = [
  { max: 90, size: 46 },
  { max: 160, size: 40 },
  { max: 240, size: 35 },
];

export const funFactTemplate = defineTemplate<Props>({
  id: 'town-fun-fact',
  name: 'Fun Fact',
  category: 'town',
  description: 'Did-you-know card about a Massachusetts town. Square.',
  canvas: CANVAS.square,
  schema,
  fields,
  mock,

  caption: (p) =>
    [`${p.eyebrow.toUpperCase()}: ${p.town}`, '', p.fact, p.source ? `\nSource: ${p.source}` : '', '', '#TowniesNation #' + p.town.replace(/\s+/g, '') + ' #Massachusetts']
      .filter(Boolean)
      .join('\n'),

  render: (p, ctx) => (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: CANVAS.square.width,
        height: CANVAS.square.height,
        backgroundColor: '#040A12',
      }}
    >
      {/* Body copy over a photo needs a heavier wash than a headline does. */}
      <Background
        image={ctx.img(p.background)}
        baseScrim={scrim.base(0.62)}
        width={CANVAS.square.width}
        height={CANVAS.square.height}
      />
      <Scrim image={scrim.bottom(0.9)} bottom={0} left={0} width={CANVAS.square.width} height={720} />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: 78,
        }}
      >
        {/* Eyebrow, with a short accent rule under it. */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Label size={26} color={p.accent} track={TRACK.widest}>
            {p.eyebrow}
          </Label>
          <div
            style={{
              display: 'flex',
              width: 88,
              height: 4,
              backgroundColor: p.accent,
              marginTop: 18,
            }}
          />
        </div>

        {/* Town name + fact, bottom-weighted. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontFamily: FONT.block,
              fontWeight: 800,
              fontSize: fitText(p.town, TOWN_STEPS, 76),
              lineHeight: 0.94,
              letterSpacing: TRACK.tight,
              textTransform: 'uppercase',
              color: '#FFFFFF',
            }}
          >
            {p.town}
          </div>

          <div
            style={{
              display: 'flex',
              fontFamily: FONT.body,
              fontWeight: 400,
              fontSize: fitText(p.fact, FACT_STEPS, 30),
              lineHeight: 1.45,
              color: 'rgba(255,255,255,0.88)',
              marginTop: 30,
              maxWidth: 830,
            }}
          >
            {p.fact}
          </div>

          {p.source ? (
            <div style={{ display: 'flex', marginTop: 22 }}>
              <Label size={19} color="rgba(255,255,255,0.45)" track={TRACK.wide}>
                {p.source}
              </Label>
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', marginTop: 44 }}>
          <BrandFooter mark={ctx.brandMark} />
        </div>
      </div>
    </div>
  ),
});
