// Drop — the one that actually sells hats.
//
// Product-led, not town-led: the photo is the product, so the scrims are
// lighter than the editorial templates and the copy stays out of the middle of
// the frame. Price and CTA are the payload.

import { z } from 'zod';
import { Background, BrandFooter, Label, Scrim } from '@/components/studio/primitives';
import { CANVAS, defineTemplate, type FieldDef } from '@/lib/studio/types';
import { ACCENT_OPTIONS, FONT, PAD, TRACK, fitText, scrim } from '@/lib/studio/design';

const schema = z.object({
  eyebrow: z.string(),
  productName: z.string(),
  town: z.string(),
  price: z.string(),
  detail: z.string(),
  cta: z.string(),
  background: z.string(),
  accent: z.string(),
});

type Props = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { key: 'eyebrow', label: 'Eyebrow', type: 'text', group: 'Drop', placeholder: 'New drop' },
  { key: 'town', label: 'Town', type: 'text', group: 'Drop', help: 'Sits above the product name as the kicker.' },
  { key: 'productName', label: 'Product name', type: 'text', group: 'Drop', placeholder: 'Classic Snapback' },
  { key: 'price', label: 'Price', type: 'text', group: 'Drop', placeholder: '$29.99' },
  { key: 'detail', label: 'Detail line', type: 'text', group: 'Drop', placeholder: 'Limited run · Ships in 4–6 weeks' },
  { key: 'cta', label: 'Call to action', type: 'text', group: 'Drop', placeholder: 'townies.shop' },
  { key: 'background', label: 'Product photo', type: 'image', group: 'Look', help: 'Use a drop photo, not a lifestyle shot — the product is the subject.' },
  { key: 'accent', label: 'Accent', type: 'select', group: 'Look', options: ACCENT_OPTIONS },
];

const mock: Props = {
  eyebrow: 'New drop',
  town: 'Milton',
  productName: 'Classic Snapback',
  price: '$29.99',
  detail: 'Limited run · Heavyweight embroidered',
  cta: 'townies.shop',
  background: '/brand/drops/milton.jpg',
  accent: '#F2EFE8',
};

const NAME_STEPS = [
  { max: 14, size: 116 },
  { max: 20, size: 96 },
  { max: 28, size: 78 },
];

export const dropTemplate = defineTemplate<Props>({
  id: 'brand-drop',
  name: 'Drop Announcement',
  category: 'brand',
  description: 'Product-led drop post with price and call to action.',
  canvas: CANVAS.portrait,
  schema,
  fields,
  mock,

  caption: (p) =>
    [
      `${p.eyebrow.toUpperCase()} — ${p.town} ${p.productName}`,
      '',
      p.detail,
      `${p.price} · ${p.cta}`,
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
        width: CANVAS.portrait.width,
        height: CANVAS.portrait.height,
        backgroundColor: '#040A12',
      }}
    >
      {/* Lightest base wash in the deck — this photo is merchandise, and
          darkening it costs sales. */}
      <Background
        image={ctx.img(p.background)}
        baseScrim={scrim.base(0.3)}
        width={CANVAS.portrait.width}
        height={CANVAS.portrait.height}
      />
      <Scrim image={scrim.top(0.62)} top={0} left={0} width={CANVAS.portrait.width} height={300} />
      <Scrim image={scrim.bottom(0.95)} bottom={0} left={0} width={CANVAS.portrait.width} height={640} />

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
              {p.eyebrow}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end' }}>
          <Label size={26} color={p.accent} track={TRACK.widest}>
            {p.town}
          </Label>

          <div
            style={{
              display: 'flex',
              fontFamily: FONT.block,
              fontWeight: 800,
              fontSize: fitText(p.productName, NAME_STEPS, 66),
              lineHeight: 0.98,
              letterSpacing: TRACK.tight,
              textTransform: 'uppercase',
              color: '#FFFFFF',
              marginTop: 14,
              maxWidth: 900,
            }}
          >
            {p.productName}
          </div>

          {/* Price and CTA on one row — the two things a buyer needs. */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 30,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontFamily: FONT.block,
                fontWeight: 800,
                fontSize: 64,
                color: p.accent,
                letterSpacing: TRACK.tight,
              }}
            >
              {p.price}
            </div>
            <div
              style={{
                display: 'flex',
                width: 2,
                height: 46,
                backgroundColor: 'rgba(255,255,255,0.25)',
                marginLeft: 26,
                marginRight: 26,
              }}
            />
            <div
              style={{
                display: 'flex',
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 32,
                letterSpacing: TRACK.wide,
                color: '#FFFFFF',
              }}
            >
              {p.cta}
            </div>
          </div>

          {p.detail ? (
            <div style={{ display: 'flex', marginTop: 22 }}>
              <Label size={22} color="rgba(255,255,255,0.62)" track={TRACK.wide}>
                {p.detail}
              </Label>
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', marginTop: 40 }}>
          <BrandFooter />
        </div>
      </div>
    </div>
  ),
});
