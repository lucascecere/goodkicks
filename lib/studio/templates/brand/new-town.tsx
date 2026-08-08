// New Town — "we now make hats for your town."
//
// Distinct from Drop on purpose. Drop sells a product; this announces that a
// town has joined the lineup, which is a town moment, not a product moment. So
// the town name is the whole composition and the commerce is a single quiet
// line at the bottom.
//
// Square, because these get shared to stories and reposted by town pages far
// more than they get scrolled past in feed.

import { z } from 'zod';
import { Background, BrandFooter, Label, Scrim } from '@/components/studio/primitives';
import { CANVAS, defineTemplate, type FieldDef } from '@/lib/studio/types';
import { ACCENT_OPTIONS, FONT, TRACK, fitText, scrim } from '@/lib/studio/design';

const schema = z.object({
  eyebrow: z.string(),
  town: z.string(),
  region: z.string(),
  subline: z.string(),
  cta: z.string(),
  background: z.string(),
  accent: z.string(),
});

type Props = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { key: 'eyebrow', label: 'Eyebrow', type: 'text', group: 'Announcement', placeholder: 'Now repping' },
  { key: 'town', label: 'Town', type: 'text', group: 'Announcement', help: 'The whole composition. Sized to fill the width.' },
  { key: 'region', label: 'Region', type: 'text', group: 'Announcement', placeholder: 'South Shore' },
  { key: 'subline', label: 'Subline', type: 'text', group: 'Announcement', placeholder: 'Hats available now' },
  { key: 'cta', label: 'Call to action', type: 'text', group: 'Announcement', placeholder: 'townies.shop' },
  { key: 'background', label: 'Background photo', type: 'image', group: 'Look' },
  { key: 'accent', label: 'Accent', type: 'select', group: 'Look', options: ACCENT_OPTIONS },
];

const mock: Props = {
  eyebrow: 'Now repping',
  town: 'Braintree',
  region: 'South Shore',
  subline: 'Hats available now',
  cta: 'townies.shop',
  background: '/brand/drops/braintree.jpg',
  accent: '#F2EFE8',
};

const TOWN_STEPS = [
  { max: 6, size: 190 },
  { max: 9, size: 158 },
  { max: 12, size: 126 },
  { max: 16, size: 100 },
];

export const newTownTemplate = defineTemplate<Props>({
  id: 'brand-new-town',
  name: 'New Town Launch',
  category: 'brand',
  description: 'Announces a town joining the lineup. Town-as-hero, square.',
  canvas: CANVAS.square,
  schema,
  fields,
  mock,

  caption: (p) =>
    [
      `${p.eyebrow.toUpperCase()}: ${p.town.toUpperCase()}`,
      '',
      `${p.region}. ${p.subline}.`,
      p.cta,
      '',
      `#TowniesNation #${p.town.replace(/\s+/g, '')} #Massachusetts #RepYourTown`,
    ]
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
      <Background
        image={ctx.img(p.background)}
        baseScrim={scrim.base(0.52)}
        width={CANVAS.square.width}
        height={CANVAS.square.height}
      />
      <Scrim image={scrim.top(0.88)} top={0} left={0} width={CANVAS.square.width} height={560} />
      <Scrim image={scrim.bottom(0.9)} bottom={0} left={0} width={CANVAS.square.width} height={300} />

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
        {/* Top-anchored, NOT vertically centered. These photos are usually the
            hats themselves, and the hats carry the town name in embroidery —
            a centered wordmark lands directly on top of it and reads as a
            duplicate. Keeping the type up top leaves the product clear. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <Label size={28} color={p.accent} track={TRACK.widest}>
            {p.eyebrow}
          </Label>

          <div
            style={{
              display: 'flex',
              fontFamily: FONT.block,
              fontWeight: 800,
              fontSize: fitText(p.town, TOWN_STEPS, 86),
              lineHeight: 0.94,
              letterSpacing: TRACK.tight,
              textTransform: 'uppercase',
              color: '#FFFFFF',
              marginTop: 18,
              textAlign: 'center',
            }}
          >
            {p.town}
          </div>

          <div
            style={{
              display: 'flex',
              width: 120,
              height: 4,
              backgroundColor: p.accent,
              marginTop: 28,
              marginBottom: 26,
            }}
          />

          <Label size={26} color="rgba(255,255,255,0.78)" track={TRACK.widest}>
            {p.region}
          </Label>

          {p.subline ? (
            <div
              style={{
                display: 'flex',
                fontFamily: FONT.body,
                fontWeight: 400,
                fontSize: 36,
                color: 'rgba(255,255,255,0.86)',
                marginTop: 22,
                textAlign: 'center',
              }}
            >
              {p.subline}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <BrandFooter mark={ctx.brandMark} />
          {p.cta ? (
            <div
              style={{
                display: 'flex',
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 28,
                letterSpacing: TRACK.wide,
                color: p.accent,
              }}
            >
              {p.cta}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  ),
});
