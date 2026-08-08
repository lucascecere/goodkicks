// Headline — the everyday news card.
//
// The workhorse of the deck: something happened in Boston or in a town, here's
// the headline over a photo. Type-led rather than module-led, so it stays out
// of the way of a strong image.

import { z } from 'zod';
import { Background, BrandFooter, Label, Scrim } from '@/components/studio/primitives';
import { CANVAS, defineTemplate, type FieldDef } from '@/lib/studio/types';
import { ACCENT_OPTIONS, FONT, PAD, TRACK, fitText, scrim } from '@/lib/studio/design';

const schema = z.object({
  kicker: z.string(),
  headline: z.string(),
  dek: z.string(),
  source: z.string(),
  dateLabel: z.string(),
  background: z.string(),
  accent: z.string(),
});

type Props = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { key: 'kicker', label: 'Kicker', type: 'text', group: 'Content', placeholder: 'Boston', help: 'The section label — a place, a beat, a team.' },
  { key: 'headline', label: 'Headline', type: 'textarea', rows: 3, group: 'Content', help: 'Shrinks automatically as it gets longer. Under ~70 characters hits hardest.' },
  { key: 'dek', label: 'Sub-headline', type: 'textarea', rows: 2, group: 'Content', placeholder: 'Optional' },
  { key: 'source', label: 'Source', type: 'text', group: 'Attribution', placeholder: 'Boston Globe', help: 'Credit the outlet. Leave blank for original reporting.' },
  { key: 'dateLabel', label: 'Date', type: 'text', group: 'Attribution' },
  { key: 'background', label: 'Background photo', type: 'image', group: 'Look' },
  { key: 'accent', label: 'Accent', type: 'select', group: 'Look', options: ACCENT_OPTIONS },
];

const mock: Props = {
  kicker: 'South Shore',
  // Kept in step with the photo (Hingham Town Hall) — a default that names one
  // town over a photo of another is the first thing a designer notices.
  headline: 'Hingham Town Meeting approves the harbor walk extension',
  dek: 'Construction on the half-mile boardwalk starts next spring.',
  source: 'Patriot Ledger',
  dateLabel: 'August 6',
  background: '/brand/lifestyle/town-hingham.jpg',
  accent: '#F2EFE8',
};

const HEADLINE_STEPS = [
  { max: 34, size: 108 },
  { max: 56, size: 88 },
  { max: 80, size: 72 },
  { max: 112, size: 60 },
];

export const headlineTemplate = defineTemplate<Props>({
  id: 'news-headline',
  name: 'Headline',
  category: 'news',
  description: 'News card — kicker, headline, sub-headline, source.',
  canvas: CANVAS.portrait,
  schema,
  fields,
  mock,

  caption: (p) =>
    [
      p.headline,
      '',
      p.dek,
      p.source ? `\nvia ${p.source}` : '',
      '',
      '#TowniesNation #Boston #Massachusetts',
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
      {/* Headline copy is bottom-anchored, so the heavy scrim goes there and
          the top of the photo stays clean. */}
      <Scrim image={scrim.bottom(0.95)} bottom={0} left={0} width={CANVAS.portrait.width} height={860} />
      <Scrim image={scrim.top(0.55)} top={0} left={0} width={CANVAS.portrait.width} height={260} />

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
        {/* Kicker in a filled accent chip — reads as a section label, and gives
            the eye somewhere to land at the top of the frame. */}
        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              paddingLeft: 22,
              paddingRight: 22,
              paddingTop: 10,
              paddingBottom: 10,
              backgroundColor: p.accent,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 24,
                letterSpacing: TRACK.wider,
                textTransform: 'uppercase',
                color: '#0D1B2A',
              }}
            >
              {p.kicker}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end' }}>
          <div
            style={{
              display: 'flex',
              fontFamily: FONT.block,
              fontWeight: 800,
              fontSize: fitText(p.headline, HEADLINE_STEPS, 50),
              lineHeight: 1.02,
              letterSpacing: TRACK.tight,
              color: '#FFFFFF',
              maxWidth: 900,
            }}
          >
            {p.headline}
          </div>

          {p.dek ? (
            <div
              style={{
                display: 'flex',
                fontFamily: FONT.body,
                fontWeight: 400,
                fontSize: 36,
                lineHeight: 1.4,
                color: 'rgba(255,255,255,0.82)',
                marginTop: 28,
                maxWidth: 860,
              }}
            >
              {p.dek}
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              height: 2,
              width: 180,
              backgroundColor: p.accent,
              marginTop: 34,
              marginBottom: 24,
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Label size={21} color="rgba(255,255,255,0.6)" track={TRACK.wide}>
              {p.dateLabel}
            </Label>
            {p.source ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.4)',
                    marginLeft: 16,
                    marginRight: 16,
                  }}
                />
                <Label size={21} color="rgba(255,255,255,0.6)" track={TRACK.wide}>
                  {p.source}
                </Label>
              </>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: 40 }}>
          <BrandFooter />
        </div>
      </div>
    </div>
  ),
});
