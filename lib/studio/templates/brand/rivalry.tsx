// Town Rivalry — two towns, two products, one mascot.
//
// Built for the Milton / Weymouth Wildcats post, but nothing about it is
// Milton-specific: any two towns that share a mascot, a border or a grudge work
// the same way.
//
// The design leans on something the products already do. Every Townies hat is
// the same silhouette — cream crown, black brim, arched collegiate wordmark —
// shot identically on white. So the ONLY thing separating two towns is the
// thread colour, which is exactly what a rivalry graphic wants to say. The
// layout puts them side by side and lets the colour do the arguing.
//
// The product photos have no alpha (studio white, not cut out), so they sit in
// white cards rather than floating on the background. That's a constraint
// turned into the look: it reads like a matchup card.

import { z } from 'zod';
import { BrandFooter, Label } from '@/components/studio/primitives';
import { CANVAS, defineTemplate, type FieldDef } from '@/lib/studio/types';
import { BRAND, FONT, TRACK, fitText } from '@/lib/studio/design';
import { pawMark, pinePattern } from '@/lib/studio/marks';

const schema = z.object({
  eyebrow: z.string(),
  headlineTop: z.string(),
  headlineBottom: z.string(),

  leftTown: z.string(),
  leftSub: z.string(),
  leftImage: z.string(),
  leftColor: z.string(),
  leftAccent: z.string(),
  leftMark: z.string(),

  rightTown: z.string(),
  rightSub: z.string(),
  rightImage: z.string(),
  rightColor: z.string(),
  rightAccent: z.string(),
  rightMark: z.string(),

  showPaw: z.boolean(),
  markOpacity: z.number(),
  bgColor: z.string(),
  showPattern: z.boolean(),
  brandAccent: z.string(),
  vsLabel: z.string(),
  prompt: z.string(),
  promptSub: z.string(),
  footnote: z.string(),
  cta: z.string(),
});

type Props = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { key: 'eyebrow', label: 'Eyebrow', type: 'text', group: 'Header' },
  { key: 'headlineTop', label: 'Headline line 1', type: 'text', group: 'Header' },
  { key: 'headlineBottom', label: 'Headline line 2', type: 'text', group: 'Header', help: 'Two short lines hit harder than one long one.' },

  { key: 'leftTown', label: 'Left — town', type: 'text', group: 'Left side' },
  { key: 'leftSub', label: 'Left — mascot', type: 'text', group: 'Left side' },
  { key: 'leftImage', label: 'Left — product photo', type: 'image', group: 'Left side', help: 'Shopify CDN URL. Add ?width=900 — the full-size files are 4MB+.' },
  { key: 'leftColor', label: 'Left — panel color', type: 'color', group: 'Left side' },
  { key: 'leftAccent', label: 'Left — accent bar', type: 'color', group: 'Left side' },
  { key: 'leftMark', label: 'Left — watermark logo', type: 'image', group: 'Left side', help: 'Transparent PNG. Leave blank to use the generic paw.' },

  { key: 'rightTown', label: 'Right — town', type: 'text', group: 'Right side' },
  { key: 'rightSub', label: 'Right — mascot', type: 'text', group: 'Right side' },
  { key: 'rightImage', label: 'Right — product photo', type: 'image', group: 'Right side' },
  { key: 'rightColor', label: 'Right — panel color', type: 'color', group: 'Right side' },
  { key: 'rightAccent', label: 'Right — accent bar', type: 'color', group: 'Right side' },
  { key: 'rightMark', label: 'Right — watermark logo', type: 'image', group: 'Right side', help: 'Transparent PNG. Leave blank to use the generic paw.' },

  { key: 'showPaw', label: 'Paw watermark (when no logo set)', type: 'toggle', group: 'Look' },
  { key: 'markOpacity', label: 'Watermark opacity %', type: 'number', min: 0, max: 100, step: 5, group: 'Look' },
  { key: 'bgColor', label: 'Background', type: 'select', group: 'Look', options: [
    { value: '#2F4F3A', label: 'Forest green (brand)' },
    { value: '#0D1B2A', label: 'Navy' },
  ] },
  { key: 'showPattern', label: 'Pine pattern overlay', type: 'toggle', group: 'Look' },
  { key: 'brandAccent', label: 'Chip & badge color', type: 'select', group: 'Look', options: [
    { value: '#0D1B2A', label: 'Navy' },
    { value: '#2F4F3A', label: 'Forest green' },
    { value: '#F2EFE8', label: 'Cream' },
  ] },
  { key: 'vsLabel', label: 'Center badge', type: 'text', group: 'Footer' },
  { key: 'prompt', label: 'Prompt', type: 'text', group: 'Footer', help: 'The ask. A rivalry post lives or dies on people replying.' },
  { key: 'promptSub', label: 'Prompt sub-line', type: 'text', group: 'Footer' },
  { key: 'footnote', label: 'Button label', type: 'text', group: 'Footer' },
  { key: 'cta', label: 'Call to action', type: 'text', group: 'Footer' },
];

const SHOPIFY = 'https://cdn.shopify.com/s/files/1/0762/1358/4027/files';

/**
 * Colours sampled from the embroidery in the actual product photos, not picked
 * by eye — so the panels match the thread rather than approximating it.
 */
const mock: Props = {
  eyebrow: 'South Shore',
  headlineTop: 'Same mascot.',
  headlineBottom: 'Forever rivalry.',

  leftTown: 'Milton',
  leftSub: 'Wildcats',
  leftImage: `${SHOPIFY}/mil-2-front.png?width=900`,
  leftColor: '#A82222',
  leftAccent: '#111111',
  leftMark: '',

  rightTown: 'Weymouth',
  rightSub: 'Wildcats',
  rightImage: `${SHOPIFY}/wey-2-front.png?width=900`,
  rightColor: '#581D25',
  rightAccent: '#BF8F37',
  rightMark: '/brand/schools/weymouth-wildcats.png',

  showPaw: true,
  markOpacity: 24,
  bgColor: BRAND.forest,
  showPattern: true,
  brandAccent: BRAND.navy,
  vsLabel: 'VS',
  prompt: 'Pick a side.',
  promptSub: 'Drop your town in the comments',
  footnote: 'In stock',
  cta: 'www.townies.shop',
};

const CARD_W = 464;
const PHOTO_H = 408;
const STRIP_H = 184;
const CARD_H = PHOTO_H + STRIP_H;
const BADGE = 108;
const PAD = 56;

const TOWN_STEPS = [
  { max: 7, size: 52 },
  { max: 10, size: 44 },
  { max: 13, size: 38 },
];

const PAW = 150;
const MARK_W = 200;
const MARK_H = STRIP_H - 12;

function Side({
  town,
  sub,
  image,
  color,
  accent,
  paw,
  mark,
  markOpacity,
}: {
  town: string;
  sub: string;
  image?: string;
  color: string;
  accent: string;
  paw?: string;
  mark?: string;
  markOpacity: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: CARD_W }}>
      {/* White photo panel. The shots are studio-white already, so the card
          edge is invisible and the hat appears to float. */}
      <div
        style={{
          display: 'flex',
          width: CARD_W,
          height: PHOTO_H,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {image ? (
          <img src={image} width={CARD_W} height={PHOTO_H} style={{ width: CARD_W, height: PHOTO_H, objectFit: 'cover' }} alt="" />
        ) : (
          <Label color="rgba(0,0,0,0.3)" size={20}>
            No photo
          </Label>
        )}
      </div>

      {/* Accent bar carries each side's second colour — Milton's black outline,
          Weymouth's gold. Putting it here rather than in the type keeps the
          mascot line legible on both panels. */}
      <div style={{ display: 'flex', width: CARD_W, height: 12, backgroundColor: accent }} />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: CARD_W,
          height: STRIP_H - 12,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Watermark. Drawn before the type so the type paints over it, and
            kept faint enough that it reads as texture rather than a logo
            competing with the town name. */}
        {mark ? (
          <img
            src={mark}
            width={MARK_W}
            height={MARK_H}
            style={{
              position: 'absolute',
              left: (CARD_W - MARK_W) / 2,
              top: 0,
              objectFit: 'contain',
              // Opacity on the element, not baked into the file — this is
              // someone else's artwork and we don't get to edit its alpha.
              opacity: markOpacity / 100,
            }}
            alt=""
          />
        ) : paw ? (
          <img
            src={paw}
            width={PAW}
            height={PAW}
            style={{
              position: 'absolute',
              left: (CARD_W - PAW) / 2,
              top: (STRIP_H - 12 - PAW) / 2,
            }}
            alt=""
          />
        ) : null}

        <div
          style={{
            display: 'flex',
            fontFamily: FONT.block,
            fontWeight: 800,
            fontSize: fitText(town, TOWN_STEPS, 32),
            letterSpacing: TRACK.tight,
            textTransform: 'uppercase',
            color: '#FFFFFF',
          }}
        >
          {town}
        </div>
        <div style={{ display: 'flex', marginTop: 8 }}>
          <Label size={21} color="rgba(255,255,255,0.82)" track={TRACK.widest}>
            {sub}
          </Label>
        </div>
      </div>
    </div>
  );
}

export const rivalryTemplate = defineTemplate<Props>({
  id: 'brand-rivalry',
  name: 'Town Rivalry',
  category: 'brand',
  description: 'Two towns, two products, one mascot. Head-to-head product card.',
  canvas: CANVAS.portrait,
  schema,
  fields,
  mock,

  caption: (p) =>
    [
      `${p.headlineTop} ${p.headlineBottom}`.toUpperCase(),
      '',
      `${p.leftTown} ${p.leftSub} vs ${p.rightTown} ${p.rightSub}. Same mascot, different side of the bridge.`,
      '',
      `${p.prompt} ${p.promptSub}.`,
      '',
      `${p.footnote} — ${p.cta}`,
      '',
      `#TowniesNation #${p.leftTown.replace(/\s+/g, '')} #${p.rightTown.replace(/\s+/g, '')} #Massachusetts #RepYourTown`,
    ]
      .filter(Boolean)
      .join('\n'),

  render: (p, ctx) => {
    // White at low alpha sits correctly over both the red and the maroon,
    // where a fixed tint would go muddy on one of them.
    const paw = p.showPaw ? pawMark('rgba(255,255,255,0.17)') : undefined;
    // Faint white trees over the green. Alpha is baked into the fill rather
    // than set with `opacity`, so the whole pattern is one flat image.
    const pattern = p.showPattern
      ? pinePattern(CANVAS.portrait.width, CANVAS.portrait.height, 'rgba(255,255,255,0.055)')
      : undefined;

    return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: CANVAS.portrait.width,
        height: CANVAS.portrait.height,
        backgroundColor: p.bgColor,
        padding: PAD,
      }}
    >
      {pattern ? (
        <img
          src={pattern}
          width={CANVAS.portrait.width}
          height={CANVAS.portrait.height}
          style={{ position: 'absolute', top: 0, left: 0 }}
          alt=""
        />
      ) : null}
      {/* Header */}
      <div style={{ display: 'flex' }}>
        <div
          style={{
            display: 'flex',
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 9,
            paddingBottom: 9,
            // Townies green, not cream: the chrome should read as the brand
            // speaking, while red and maroon stay the towns' own voices.
            backgroundColor: p.brandAccent,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: TRACK.wider,
              textTransform: 'uppercase',
              color: BRAND.cream,
            }}
          >
            {p.eyebrow}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 26,
        }}
      >
        {[p.headlineTop, p.headlineBottom].filter(Boolean).map((line, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              fontFamily: FONT.block,
              fontWeight: 800,
              fontSize: 88,
              lineHeight: 1.0,
              letterSpacing: TRACK.tight,
              textTransform: 'uppercase',
              color: i === 0 ? '#FFFFFF' : BRAND.cream,
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Matchup. The gap between the two cards is the dividing line; the badge
          straddles it so neither side owns the centre. */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: CANVAS.portrait.width - PAD * 2,
          marginTop: 46,
        }}
      >
        <Side
          town={p.leftTown}
          sub={p.leftSub}
          image={ctx.img(p.leftImage)}
          color={p.leftColor}
          accent={p.leftAccent}
          paw={paw}
          mark={ctx.img(p.leftMark)}
          markOpacity={p.markOpacity}
        />
        <Side
          town={p.rightTown}
          sub={p.rightSub}
          image={ctx.img(p.rightImage)}
          color={p.rightColor}
          accent={p.rightAccent}
          paw={paw}
          mark={ctx.img(p.rightMark)}
          markOpacity={p.markOpacity}
        />

        <div
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            left: (CANVAS.portrait.width - PAD * 2 - BADGE) / 2,
            top: (CARD_H - BADGE) / 2,
            width: BADGE,
            height: BADGE,
            borderRadius: BADGE / 2,
            backgroundColor: p.brandAccent,
            border: `4px solid ${BRAND.cream}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontFamily: FONT.block,
              fontWeight: 800,
              fontSize: 40,
              letterSpacing: TRACK.tight,
              color: BRAND.cream,
            }}
          >
            {p.vsLabel}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }} />

      {/* Fills what was a dead band of navy, and asks for the reply. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: FONT.block,
            fontWeight: 800,
            fontSize: 68,
            letterSpacing: TRACK.tight,
            textTransform: 'uppercase',
            color: '#FFFFFF',
          }}
        >
          {p.prompt}
        </div>
        {p.promptSub ? (
          <div style={{ display: 'flex', marginTop: 12 }}>
            <Label size={23} color="rgba(242,239,232,0.7)" track={TRACK.wide}>
              {p.promptSub}
            </Label>
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', flex: 1 }} />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            height: 2,
            width: '100%',
            backgroundColor: 'rgba(242,239,232,0.25)',
            marginBottom: 24,
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              paddingLeft: 26,
              paddingRight: 26,
              paddingTop: 13,
              paddingBottom: 13,
              backgroundColor: BRAND.navy,
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
                color: '#FFFFFF',
              }}
            >
              {p.footnote}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: TRACK.wide,
              color: BRAND.cream,
            }}
          >
            {p.cta}
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: 26 }}>
          <BrandFooter mark={ctx.brandMark} />
        </div>
      </div>
    </div>
    );
  },
});
