// Brand Cover — the Massachusetts banner.
//
// One design, several canvases. A Shopify hero (16:9) and a LinkedIn company
// banner (roughly 6:1) are not the same picture at different sizes — at 191px
// tall a stacked composition is unreadable — so the render switches layout on
// aspect ratio rather than trying to squeeze one arrangement into both.
//
// Everything scales off canvas height, so adding another size is one more
// registry line rather than a new set of hand-tuned numbers.

import { z } from 'zod';
import { Label } from '@/components/studio/primitives';
import { defineTemplate, type Canvas, type FieldDef, type TemplateDef } from '@/lib/studio/types';
import { BRAND, FONT, TRACK } from '@/lib/studio/design';
import { maMark, pinePattern } from '@/lib/studio/marks';

const schema = z.object({
  slogan: z.string(),
  subline: z.string(),
  cta: z.string(),
  bgColor: z.string(),
  showPattern: z.boolean(),
  showState: z.boolean(),
});

type Props = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { key: 'slogan', label: 'Slogan', type: 'text', group: 'Content', help: 'The line people remember. Short.' },
  { key: 'subline', label: 'Sub-line', type: 'text', group: 'Content', placeholder: 'Optional' },
  { key: 'cta', label: 'Call to action', type: 'text', group: 'Content', placeholder: 'www.townies.shop' },
  { key: 'bgColor', label: 'Background', type: 'select', group: 'Look', options: [
    { value: '#2F4F3A', label: 'Forest green (brand)' },
    { value: '#0D1B2A', label: 'Navy' },
  ] },
  { key: 'showPattern', label: 'Pine pattern', type: 'toggle', group: 'Look' },
  { key: 'showState', label: 'Massachusetts silhouette', type: 'toggle', group: 'Look' },
];

const mock: Props = {
  slogan: 'Town by town.',
  subline: 'Local pride, Boston sports, and the stuff only people from here get.',
  cta: 'www.townies.shop',
  bgColor: BRAND.forest,
  showPattern: true,
  showState: true,
};

/** Past this ratio a stacked layout stops fitting and the banner goes to one row. */
const WIDE_RATIO = 3;

function makeCover(
  id: string,
  name: string,
  description: string,
  canvas: Canvas
): TemplateDef<Props> {
  return defineTemplate<Props>({
    id,
    name,
    category: 'brand',
    description,
    canvas,
    schema,
    fields,
    mock,

    caption: (p) => [p.slogan, '', p.subline, '', p.cta].filter(Boolean).join('\n'),

    render: (p, ctx) => {
      const { width, height } = canvas;
      const wide = width / height > WIDE_RATIO;

      // Type is sized as a FRACTION OF CANVAS HEIGHT, not against a fixed
      // 1080 reference. A ratio-to-1080 scale collapses on a short banner —
      // at 191px tall it produced 10px type, which is unreadable.
      const px = (fraction: number) => Math.max(9, Math.round(height * fraction));

      const pad = wide ? Math.round(height * 0.16) : Math.round(height * 0.09);
      const markH = wide ? px(0.4) : px(0.19);
      const markW = Math.round(markH * (420 / 159));
      // Roomier on the wide banner so it doesn't crowd the right-hand copy.
      const stateH = wide ? px(0.95) : px(0.5);
      const stateW = Math.round(stateH * (60.6 / 32.6));
      const sloganSize = wide ? px(0.17) : px(0.068);
      const sublineSize = px(0.031);
      const ctaSize = wide ? px(0.075) : px(0.026);

      const pattern = p.showPattern
        ? pinePattern(width, height, 'rgba(242,239,232,0.055)')
        : null;
      const state = p.showState ? maMark('rgba(242,239,232,0.10)') : null;

      return (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: wide ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: wide ? 'space-between' : 'center',
            width,
            height,
            backgroundColor: p.bgColor,
            paddingLeft: pad,
            paddingRight: pad,
          }}
        >
          {pattern ? (
            <img
              src={pattern}
              width={width}
              height={height}
              style={{ position: 'absolute', top: 0, left: 0 }}
              alt=""
            />
          ) : null}

          {/* The state sits off to one side rather than dead centre so it reads
              as a mark the composition is built around, not a background fill. */}
          {state ? (
            <img
              src={state}
              width={stateW}
              height={stateH}
              // Spread one side or the other rather than setting the unused
              // one to undefined: Satori parses every key it finds and throws
              // on an undefined value, with an error that names no element.
              style={{
                position: 'absolute',
                ...(wide
                  ? { left: Math.round(width * 0.36) }
                  : { right: Math.round(width * 0.05) }),
                top: Math.round((height - stateH) / 2),
                objectFit: 'contain',
              }}
              alt=""
            />
          ) : null}

          {/* Wordmark */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              marginBottom: wide ? 0 : px(0.05),
            }}
          >
            {ctx.brandMark ? (
              <img src={ctx.brandMark} width={markW} height={markH} style={{ objectFit: 'contain' }} alt="" />
            ) : (
              <div
                style={{
                  display: 'flex',
                  fontFamily: FONT.script,
                  fontSize: Math.round(markH * 0.8),
                  color: BRAND.cream,
                }}
              >
                Townies
              </div>
            )}
          </div>

          {/* Copy */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: wide ? 'flex-end' : 'center',
              maxWidth: wide ? Math.round(width * 0.5) : Math.round(width * 0.72),
            }}
          >
            <div
              style={{
                display: 'flex',
                fontFamily: FONT.block,
                fontWeight: 800,
                fontSize: sloganSize,
                lineHeight: 1.05,
                letterSpacing: TRACK.tight,
                textTransform: 'uppercase',
                color: '#FFFFFF',
                textAlign: wide ? 'right' : 'center',
              }}
            >
              {p.slogan}
            </div>

            {p.subline && !wide ? (
              <div
                style={{
                  display: 'flex',
                  fontFamily: FONT.body,
                  fontWeight: 400,
                  fontSize: sublineSize,
                  lineHeight: 1.45,
                  color: 'rgba(242,239,232,0.82)',
                  marginTop: px(0.026),
                  textAlign: 'center',
                }}
              >
                {p.subline}
              </div>
            ) : null}

            {p.cta ? (
              <div style={{ display: 'flex', marginTop: px(wide ? 0.04 : 0.03) }}>
                <Label
                  size={ctaSize}
                  color="rgba(242,239,232,0.75)"
                  track={TRACK.widest}
                >
                  {p.cta}
                </Label>
              </div>
            ) : null}
          </div>

        </div>
      );
    },
  });
}

export const coverShopifyTemplate = makeCover(
  'brand-cover-shopify',
  'Cover — Shopify / Hero',
  'Massachusetts brand banner, 16:9. Shopify hero or site header.',
  { width: 1920, height: 1080 }
);

export const coverLinkedInTemplate = makeCover(
  'brand-cover-linkedin',
  'Cover — LinkedIn Page',
  'LinkedIn company page banner. Very wide and short.',
  { width: 1128, height: 191 }
);

export const coverLinkedInProfileTemplate = makeCover(
  'brand-cover-linkedin-profile',
  'Cover — LinkedIn Profile',
  'LinkedIn personal profile background, 4:1.',
  { width: 1584, height: 396 }
);
