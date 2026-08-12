// Partner / Collab — the co-branded discount card.
//
// A partner card has one job the other brand templates don't: it has to make a
// CODE memorable at thumbnail size, from a phone, in someone else's feed. So
// the code is the hero, set in a slab panel at display size — not a caption
// line under a logo lockup, which is what most collab posts do and why nobody
// remembers the code.
//
// The lockup is deliberately "ours × theirs" with both marks at matched
// optical weight. The partner's logo is a supplied image (their brand, their
// artwork — we don't redraw it), so the layout has to survive any aspect ratio:
// the mark sits in a fixed square well and is contained, never cropped.
//
// Three canvases off one design: Instagram square, Instagram portrait, and a
// wide banner for the partner’s own site. Everything scales off the short side,
// so a fourth size is one registry line.

import { z } from 'zod';
import { Label } from '@/components/studio/primitives';
import { defineTemplate, type Canvas, type FieldDef, type TemplateDef } from '@/lib/studio/types';
import { BRAND, FONT, TRACK, fitText } from '@/lib/studio/design';
import { pinePattern } from '@/lib/studio/marks';

const schema = z.object({
  partnerName: z.string(),
  partnerLogo: z.string(),
  eyebrow: z.string(),
  headline: z.string(),
  code: z.string(),
  offer: z.string(),
  footnote: z.string(),
  bgColor: z.string(),
  showPattern: z.boolean(),
});

type Props = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { key: 'partnerName', label: 'Partner name', type: 'text', group: 'Partner',
    help: 'Shown under their logo if the artwork has no wordmark.' },
  { key: 'partnerLogo', label: 'Partner logo', type: 'text', group: 'Partner',
    placeholder: '/brand/partners/tl-elite.png',
    help: 'Path in /public or a full URL. Contained, never cropped.' },
  { key: 'eyebrow', label: 'Eyebrow', type: 'text', group: 'Content' },
  { key: 'headline', label: 'Headline', type: 'text', group: 'Content' },
  { key: 'code', label: 'Discount code', type: 'text', group: 'Offer',
    help: 'The hero of the card. Keep it short enough to read on a phone.' },
  { key: 'offer', label: 'Offer line', type: 'text', group: 'Offer',
    placeholder: '10% off every Townies hat' },
  { key: 'footnote', label: 'Footnote', type: 'text', group: 'Offer',
    placeholder: 'www.townies.shop' },
  { key: 'bgColor', label: 'Background', type: 'select', group: 'Look', options: [
    { value: BRAND.navy, label: 'Navy (brand)' },
    { value: BRAND.forest, label: 'Forest green' },
  ] },
  { key: 'showPattern', label: 'Pine pattern', type: 'toggle', group: 'Look' },
];

const mock: Props = {
  partnerName: 'TL Elite Hockey',
  partnerLogo: '/brand/partners/tl-elite.png',
  eyebrow: 'Official partner',
  headline: 'TL Elite × Townies',
  code: 'TLELITE10',
  offer: '10% off every Townies hat',
  footnote: 'www.townies.shop',
  bgColor: BRAND.navy,
  showPattern: true,
};

function makePartner(
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

    // The partner logo is a prop value, so the renderer's prop-walk finds it —
    // but declaring it keeps the card working if that walk ever narrows.
    imageRefs: (p) => [p.partnerLogo],

    caption: (p) =>
      [
        `${p.headline}.`,
        '',
        `${p.offer} with code ${p.code.toUpperCase()} at ${p.footnote}.`,
      ]
        .filter(Boolean)
        .join('\n'),

    render: (p, ctx) => {
      const { width, height } = canvas;

      // Everything scales off the SHORT side, which is 1080 on all three
      // canvases — so the lockup, code chip and type are pixel-identical
      // across square, portrait and banner, and only the surrounding space
      // changes. Scaling off height instead made the 16:9 banner render the
      // stack ~1070px tall inside 1080px and clip the eyebrow and footnote.
      const base = Math.min(width, height);
      const px = (fraction: number) => Math.max(10, Math.round(base * fraction));
      const padX = Math.round(width * 0.07);
      const padY = Math.round(height * 0.07);

      const markWell = px(0.2);
      const ourMarkH = px(0.078);
      const ourMarkW = Math.round(ourMarkH * (420 / 159));
      const crossSize = px(0.055);

      // A code is a single unbroken token — it cannot wrap, so it has to
      // shrink. TLELITE10 is 9 characters; the steps carry a longer one.
      const codeMax = px(0.135);
      const codeSize = fitText(
        p.code,
        [
          { max: 9, size: codeMax },
          { max: 12, size: Math.round(codeMax * 0.8) },
          { max: 16, size: Math.round(codeMax * 0.62) },
        ],
        Math.round(codeMax * 0.5),
      );
      const codePadX = Math.round(codeSize * 0.52);
      const codePadY = Math.round(codeSize * 0.26);

      const partnerLogo = ctx.img(p.partnerLogo);
      const pattern = p.showPattern
        ? pinePattern(width, height, 'rgba(242,239,232,0.05)')
        : null;

      return (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width,
            height,
            backgroundColor: p.bgColor,
            paddingLeft: padX,
            paddingRight: padX,
            paddingTop: padY,
            paddingBottom: padY,
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

          {/* Eyebrow */}
          <div style={{ display: 'flex', position: 'relative', marginBottom: px(0.045) }}>
            <Label size={px(0.026)} color="rgba(242,239,232,0.65)" track={TRACK.widest}>
              {p.eyebrow}
            </Label>
          </div>

          {/* Lockup: ours × theirs. Both marks sit in wells of the same height
              so a tall roundel and a wide wordmark still read as equals. */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: px(0.05),
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: markWell,
                height: markWell,
              }}
            >
              {ctx.brandMark ? (
                <img
                  src={ctx.brandMark}
                  width={ourMarkW}
                  height={ourMarkH}
                  style={{ objectFit: 'contain' }}
                  alt=""
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    fontFamily: FONT.script,
                    fontSize: Math.round(markWell * 0.34),
                    color: BRAND.cream,
                  }}
                >
                  Townies
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                fontFamily: FONT.block,
                fontWeight: 400,
                fontSize: crossSize,
                color: 'rgba(242,239,232,0.45)',
                marginLeft: px(0.02),
                marginRight: px(0.02),
              }}
            >
              ×
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: markWell,
                height: markWell,
              }}
            >
              {partnerLogo ? (
                <img
                  src={partnerLogo}
                  width={markWell}
                  height={markWell}
                  style={{ objectFit: 'contain' }}
                  alt=""
                />
              ) : (
                // No artwork supplied — set their name rather than leaving a
                // hole, so the card is still postable.
                <div
                  style={{
                    display: 'flex',
                    fontFamily: FONT.block,
                    fontWeight: 800,
                    fontSize: Math.round(markWell * 0.17),
                    lineHeight: 1.1,
                    letterSpacing: TRACK.tight,
                    textTransform: 'uppercase',
                    color: BRAND.cream,
                    textAlign: 'center',
                  }}
                >
                  {p.partnerName}
                </div>
              )}
            </div>
          </div>

          {/* Headline */}
          {p.headline ? (
            <div
              style={{
                position: 'relative',
                display: 'flex',
                fontFamily: FONT.block,
                fontWeight: 800,
                fontSize: fitText(
                  p.headline,
                  [
                    { max: 18, size: px(0.072) },
                    { max: 26, size: px(0.059) },
                    { max: 34, size: px(0.049) },
                  ],
                  px(0.04),
                ),
                lineHeight: 1.05,
                letterSpacing: TRACK.tight,
                textTransform: 'uppercase',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: px(0.055),
              }}
            >
              {p.headline}
            </div>
          ) : null}

          {/* The code, as a physical-looking chip. Cream on navy is the
              highest-contrast pair in the palette, which is what a code needs. */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: BRAND.cream,
              paddingLeft: codePadX,
              paddingRight: codePadX,
              paddingTop: codePadY,
              paddingBottom: codePadY,
              borderRadius: Math.round(codeSize * 0.14),
            }}
          >
            <div
              style={{
                display: 'flex',
                fontFamily: FONT.block,
                fontWeight: 800,
                fontSize: codeSize,
                lineHeight: 1,
                letterSpacing: TRACK.wide,
                textTransform: 'uppercase',
                color: p.bgColor,
              }}
            >
              {p.code}
            </div>
          </div>

          {/* Offer */}
          {p.offer ? (
            <div
              style={{
                position: 'relative',
                display: 'flex',
                fontFamily: FONT.body,
                fontWeight: 400,
                fontSize: px(0.036),
                lineHeight: 1.4,
                color: 'rgba(242,239,232,0.88)',
                textAlign: 'center',
                marginTop: px(0.04),
                maxWidth: Math.round(width * 0.8),
              }}
            >
              {p.offer}
            </div>
          ) : null}

          {/* Footnote */}
          {p.footnote ? (
            <div style={{ position: 'relative', display: 'flex', marginTop: px(0.045) }}>
              <Label size={px(0.026)} color="rgba(242,239,232,0.6)" track={TRACK.widest}>
                {p.footnote}
              </Label>
            </div>
          ) : null}
        </div>
      );
    },
  });
}

export const partnerSquareTemplate = makePartner(
  'brand-partner-square',
  'Partner — Instagram Square',
  'Co-branded partner card with a discount code. 1:1 for the feed.',
  { width: 1080, height: 1080 }
);

export const partnerPortraitTemplate = makePartner(
  'brand-partner-portrait',
  'Partner — Instagram Portrait',
  'Co-branded partner card, 4:5. Takes the most feed real estate.',
  { width: 1080, height: 1350 }
);

export const partnerBannerTemplate = makePartner(
  'brand-partner-banner',
  'Partner — Web Banner',
  'Wide co-branded banner, 16:9. For the partner’s own site.',
  { width: 1920, height: 1080 }
);
