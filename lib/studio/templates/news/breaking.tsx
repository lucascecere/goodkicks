// Breaking — the loud one.
//
// Same information as Headline, deliberately louder: a full-width alert bar,
// a heavier wash, bigger type, no photo subtlety. It should be visibly
// different from Headline at thumbnail size in the feed, otherwise there's no
// reason for both to exist.
//
// The alert bar defaults to red because that is what "breaking" reads as
// everywhere else on the internet — this is one of the few places the team
// palette convention gives way to a stronger convention.

import { z } from 'zod';
import { Background, BrandFooter, Scrim } from '@/components/studio/primitives';
import { CANVAS, defineTemplate, type FieldDef } from '@/lib/studio/types';
import { FONT, PAD, TRACK, fitText, scrim } from '@/lib/studio/design';

const schema = z.object({
  label: z.string(),
  headline: z.string(),
  detail: z.string(),
  source: z.string(),
  background: z.string(),
  barColor: z.string(),
});

type Props = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { key: 'label', label: 'Alert label', type: 'text', group: 'Content', placeholder: 'Breaking' },
  { key: 'headline', label: 'Headline', type: 'textarea', rows: 3, group: 'Content', help: 'Short and flat. This template is loud enough without a long sentence.' },
  { key: 'detail', label: 'Detail line', type: 'textarea', rows: 2, group: 'Content', placeholder: 'Optional' },
  { key: 'source', label: 'Source', type: 'text', group: 'Content', placeholder: 'Optional' },
  { key: 'background', label: 'Background photo', type: 'image', group: 'Look' },
  { key: 'barColor', label: 'Bar color', type: 'select', group: 'Look', options: [
    { value: '#BD3039', label: 'Red (default)' },
    { value: '#FFB81C', label: 'Gold' },
    { value: '#0D1B2A', label: 'Navy' },
  ] },
];

const mock: Props = {
  label: 'Breaking',
  headline: 'Red Sox acquire All-Star closer ahead of the deadline',
  detail: 'Deal includes two prospects and a player to be named.',
  source: 'MLB Network',
  background: '/brand/scene/clover-hero-16x10.jpg',
  barColor: '#BD3039',
};

const HEADLINE_STEPS = [
  { max: 32, size: 116 },
  { max: 52, size: 96 },
  { max: 76, size: 80 },
  { max: 104, size: 66 },
];

const BAR_HEIGHT = 128;

export const breakingTemplate = defineTemplate<Props>({
  id: 'news-breaking',
  name: 'Breaking News',
  category: 'news',
  description: 'Full-width alert bar over a heavy wash. Loud on purpose.',
  canvas: CANVAS.portrait,
  schema,
  fields,
  mock,

  caption: (p) =>
    [`${p.label.toUpperCase()}: ${p.headline}`, '', p.detail, p.source ? `\nvia ${p.source}` : '', '', '#TowniesNation #Boston']
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
      {/* Heavier than every other template — urgency reads as contrast, and the
          photo is context here, not the subject. */}
      <Background
        image={ctx.img(p.background)}
        baseScrim={scrim.base(0.72)}
        width={CANVAS.portrait.width}
        height={CANVAS.portrait.height}
      />
      <Scrim image={scrim.bottom(0.96)} bottom={0} left={0} width={CANVAS.portrait.width} height={900} />

      {/* Alert bar, full bleed across the top. */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          top: 0,
          left: 0,
          width: CANVAS.portrait.width,
          height: BAR_HEIGHT,
          backgroundColor: p.barColor,
          paddingLeft: PAD,
          paddingRight: PAD,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: FONT.block,
            fontWeight: 800,
            fontSize: 58,
            letterSpacing: TRACK.wide,
            textTransform: 'uppercase',
            color: '#FFFFFF',
          }}
        >
          {p.label}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          paddingLeft: PAD,
          paddingRight: PAD,
          paddingTop: BAR_HEIGHT + 48,
          paddingBottom: PAD,
          justifyContent: 'flex-end',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: FONT.block,
            fontWeight: 800,
            fontSize: fitText(p.headline, HEADLINE_STEPS, 56),
            lineHeight: 1.0,
            letterSpacing: TRACK.tight,
            textTransform: 'uppercase',
            color: '#FFFFFF',
            maxWidth: 930,
          }}
        >
          {p.headline}
        </div>

        {p.detail ? (
          <div
            style={{
              display: 'flex',
              fontFamily: FONT.body,
              fontWeight: 400,
              fontSize: 38,
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.86)',
              marginTop: 30,
              maxWidth: 880,
            }}
          >
            {p.detail}
          </div>
        ) : null}

        {p.source ? (
          <div
            style={{
              display: 'flex',
              fontFamily: FONT.body,
              fontWeight: 600,
              fontSize: 22,
              letterSpacing: TRACK.wide,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
              marginTop: 30,
            }}
          >
            {p.source}
          </div>
        ) : null}

        <div style={{ display: 'flex', marginTop: 46 }}>
          <BrandFooter mark={ctx.brandMark} />
        </div>
      </div>
    </div>
  ),
});
