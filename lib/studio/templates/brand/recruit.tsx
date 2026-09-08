// Recruit — the "we're looking for people" card.
//
// A recruitment post is not a product post. Nothing here is for sale, so the
// commerce chrome (price, shop link, drop language) is absent and the whole
// card is one offer: who we want, and what they get, decided in about a second
// and a half of scrolling.
//
// The first version of this was a photo band over a dark panel of stat rows,
// which is the shape of a pricing table and read like one. What a recruitment
// piece actually wants to look like is a NOTICE — something printed and pinned
// up, high contrast, type doing the shouting. Hence cream grounds, navy slab,
// hard rules, and a numbered spec row. Three layouts ship because the same
// content genuinely reads differently as a poster, an editorial split, and a
// product shot, and which one wins depends on the feed it lands in.
//
// Rates are agreed per-rep, so every number here is free text. A template that
// hardcoded "20%" would eventually publish a claim the program doesn't honour.

import { z } from 'zod';
import { Label } from '@/components/studio/primitives';
import { CANVAS, defineTemplate, type FieldDef, type RenderContext } from '@/lib/studio/types';
import { BRAND, FONT, TRACK } from '@/lib/studio/design';

const W = CANVAS.portrait.width;
const H = CANVAS.portrait.height;

const schema = z.object({
  layout: z.enum(['notice', 'split', 'cutout']),
  kicker: z.string(),
  eyebrow: z.string(),
  headline: z.string(),
  subhead: z.string(),
  stat1: z.string(),
  label1: z.string(),
  stat2: z.string(),
  label2: z.string(),
  stat3: z.string(),
  label3: z.string(),
  cta: z.string(),
  photo: z.string(),
  strip: z.string(),
  cutout: z.string(),
});

type Props = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { key: 'layout', label: 'Layout', type: 'select', group: 'Look', options: [
    { value: 'notice', label: 'Notice — cream poster, photo strip' },
    { value: 'split', label: 'Split — copy column + full-height photo' },
    { value: 'cutout', label: 'Cutout — navy, hat as the hero' },
  ] },
  { key: 'kicker', label: 'Top bar', type: 'text', group: 'The call',
    help: 'Reversed micro-type in the navy rail. Brand line, not a message.' },
  { key: 'eyebrow', label: 'Eyebrow', type: 'text', group: 'The call', placeholder: 'Now recruiting · NIL' },
  { key: 'headline', label: 'Headline', type: 'text', group: 'The call',
    help: 'Each word gets its own line and the last one is reversed out of a navy block. Two words is the sweet spot.' },
  { key: 'subhead', label: 'Who it is for', type: 'text', group: 'The call',
    help: 'The qualifier. Specific enough that the wrong people scroll past.' },

  { key: 'stat1', label: 'Spec 1', type: 'text', group: 'What you get' },
  { key: 'label1', label: 'Spec 1 detail', type: 'text', group: 'What you get' },
  { key: 'stat2', label: 'Spec 2', type: 'text', group: 'What you get' },
  { key: 'label2', label: 'Spec 2 detail', type: 'text', group: 'What you get' },
  { key: 'stat3', label: 'Spec 3', type: 'text', group: 'What you get' },
  { key: 'label3', label: 'Spec 3 detail', type: 'text', group: 'What you get' },

  { key: 'cta', label: 'Call to action', type: 'text', group: 'What you get', placeholder: 'townies.shop/ambassadors' },
  { key: 'photo', label: 'Photo — tall', type: 'image', group: 'Look', help: 'Split\u2019s full-height column. Needs a frame that survives a narrow crop.' },
  { key: 'strip', label: 'Photo — band', type: 'image', group: 'Look', help: 'Notice\u2019s bottom strip. Needs a wide frame; a square crops to nothing here.' },
  { key: 'cutout', label: 'Cutout hat', type: 'image', group: 'Look', help: 'Used by Cutout. Needs a transparent PNG.' },
];

const mock: Props = {
  layout: 'notice',
  kicker: 'Townies Apparel Co. · Massachusetts · Est. 2024',
  eyebrow: 'Now recruiting · NIL',
  headline: 'Athletes wanted',
  subhead: 'Massachusetts-born, playing D1, D2 or D3',
  stat1: '15% off',
  label1: 'For everyone who uses your code',
  stat2: '20% max',
  label2: 'Commission, agreed up front',
  stat3: 'Free hat',
  label3: 'Your hometown, shipped to you',
  cta: 'townies.shop/ambassadors',
  photo: '/brand/scene/clover-hero-1x1.jpg',
  strip: '/brand/scene/milton-21x9.jpg',
  cutout: '/brand/product/wey-cutout.png',
};

/** The navy script lockup — the cream one on the render context disappears on
 *  a cream ground, so the light layouts load their own. */
const SCRIPT_NAVY = '/brand/logos/script-word.png';

const INK = BRAND.navy;
const MUTED = '#5C6168';

/**
 * Headline sizing.
 *
 * Each word takes its own line, so the size is set by the LONGEST word, not by
 * the whole string — sizing off total length shrinks a two-word headline to
 * nothing for no reason. 0.56em per cap is Rokkitt ExtraBold measured, not
 * guessed; the clamp keeps a one-word headline from going comical.
 */
function headlineSize(words: string[], available: number, cap: number): number {
  const longest = words.reduce((n, w) => Math.max(n, w.length), 1);
  return Math.max(58, Math.min(cap, Math.floor(available / (longest * 0.56))));
}

function words(headline: string): string[] {
  return headline.trim().split(/\s+/).filter(Boolean);
}

/* ----------------------------------------------------------------- pieces */

/** Reversed micro-type rail. The thing that makes it read as printed. */
function TopRail({ text, background = INK, color = BRAND.cream }: { text: string; background?: string; color?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        width: W,
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: background,
      }}
    >
      <Label size={20} color={color} track={TRACK.widest}>
        {text}
      </Label>
    </div>
  );
}

/** Stacked headline, last word reversed out of a solid block. */
function Headline({
  text,
  size,
  ink,
  blockText,
  blockGround,
}: {
  text: string;
  size: number;
  ink: string;
  blockText: string;
  blockGround: string;
}) {
  const lines = words(text);
  const last = lines.length - 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      {lines.map((word, i) => {
        const reversed = i === last && lines.length > 1;
        return (
          <div
            key={`${word}-${i}`}
            style={{
              display: 'flex',
              // The block needs padding to be a block; an unreversed line must
              // not get it or the lines stop sharing a left edge.
              paddingLeft: reversed ? 20 : 0,
              paddingRight: reversed ? 20 : 0,
              paddingTop: reversed ? 6 : 0,
              paddingBottom: reversed ? 10 : 0,
              marginLeft: reversed ? -20 : 0,
              marginTop: reversed ? 8 : 0,
              backgroundColor: reversed ? blockGround : 'transparent',
              fontFamily: FONT.block,
              fontWeight: 800,
              fontSize: size,
              lineHeight: 0.9,
              letterSpacing: TRACK.tight,
              textTransform: 'uppercase',
              color: reversed ? blockText : ink,
            }}
          >
            {word}
          </div>
        );
      })}
    </div>
  );
}

/** The double rule under a headline. Poster grammar, cheap and effective. */
function DoubleRule({ color, width = '100%' }: { color: string; width?: number | string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width }}>
      <div style={{ display: 'flex', height: 7, width: '100%', backgroundColor: color }} />
      <div style={{ display: 'flex', height: 2, width: '100%', backgroundColor: color, marginTop: 9 }} />
    </div>
  );
}

/** One numbered spec column. */
function Spec({
  index,
  stat,
  label,
  ink,
  muted,
  accent,
  width,
  statSize = 44,
}: {
  index: string;
  stat: string;
  label: string;
  ink: string;
  muted: string;
  accent: string;
  width?: number;
  statSize?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width }}>
      <Label size={19} color={accent} track={TRACK.widest}>
        {index}
      </Label>
      <div
        style={{
          display: 'flex',
          fontFamily: FONT.block,
          fontWeight: 800,
          fontSize: statSize,
          lineHeight: 1,
          letterSpacing: TRACK.tight,
          textTransform: 'uppercase',
          color: ink,
          marginTop: 12,
        }}
      >
        {stat}
      </div>
      <div
        style={{
          display: 'flex',
          fontFamily: FONT.body,
          fontWeight: 400,
          fontSize: 22,
          lineHeight: 1.32,
          color: muted,
          marginTop: 10,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function SpecRow({
  p,
  ink,
  muted,
  accent,
  divider,
  total,
  statSize,
}: {
  p: Props;
  ink: string;
  muted: string;
  accent: string;
  divider: string;
  total: number;
  statSize?: number;
}) {
  const gutter = 30;
  const col = Math.floor((total - gutter * 2 - 2) / 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
      <Spec index="01" stat={p.stat1} label={p.label1} ink={ink} muted={muted} accent={accent} width={col} statSize={statSize} />
      <div style={{ display: 'flex', width: 1, height: 132, backgroundColor: divider, marginLeft: gutter / 2, marginRight: gutter / 2 }} />
      <Spec index="02" stat={p.stat2} label={p.label2} ink={ink} muted={muted} accent={accent} width={col} statSize={statSize} />
      <div style={{ display: 'flex', width: 1, height: 132, backgroundColor: divider, marginLeft: gutter / 2, marginRight: gutter / 2 }} />
      <Spec index="03" stat={p.stat3} label={p.label3} ink={ink} muted={muted} accent={accent} width={col} statSize={statSize} />
    </div>
  );
}

/** Footer lockup that can go dark-on-light, unlike the shared BrandFooter. */
function Signature({ mark, color, muted }: { mark?: string; color: string; muted: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      {mark ? (
        <img src={mark} width={110} height={42} style={{ objectFit: 'contain' }} alt="" />
      ) : (
        <div style={{ display: 'flex', fontFamily: FONT.script, fontSize: 34, color }}>Townies</div>
      )}
      <div style={{ display: 'flex', width: 1, height: 24, backgroundColor: muted, marginLeft: 16, marginRight: 16 }} />
      <Label size={17} color={muted} track={TRACK.wider}>
        Townies Nation
      </Label>
    </div>
  );
}

/* ---------------------------------------------------------------- layouts */

/** A. NOTICE — cream poster, type-led, photo bleeding off the bottom. */
function renderNotice(p: Props, ctx: RenderContext) {
  const photo = ctx.img(p.strip);
  const PHOTO_H = 348;
  const pad = 68;
  const size = headlineSize(words(p.headline), W - pad * 2, 178);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: W, height: H, backgroundColor: BRAND.cream }}>
      <TopRail text={p.kicker} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: W,
          flex: 1,
          paddingLeft: pad,
          paddingRight: pad,
          paddingTop: 46,
          paddingBottom: 40,
        }}
      >
        <Label size={22} color={BRAND.forest} track={TRACK.widest}>
          {p.eyebrow}
        </Label>

        <div style={{ display: 'flex', marginTop: 26 }}>
          <Headline text={p.headline} size={size} ink={INK} blockText={BRAND.cream} blockGround={INK} />
        </div>

        <div style={{ display: 'flex', marginTop: 34 }}>
          <DoubleRule color={INK} />
        </div>

        <div
          style={{
            display: 'flex',
            fontFamily: FONT.body,
            fontWeight: 600,
            fontSize: 28,
            letterSpacing: TRACK.wide,
            textTransform: 'uppercase',
            color: INK,
            marginTop: 26,
          }}
        >
          {p.subhead}
        </div>

        <div style={{ display: 'flex', flex: 1 }} />

        <SpecRow p={p} ink={INK} muted={MUTED} accent={BRAND.forest} divider="rgba(13,27,42,0.2)" total={W - pad * 2} />

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 46 }}>
          <Signature mark={ctx.img(SCRIPT_NAVY)} color={INK} muted={MUTED} />
          <div
            style={{
              display: 'flex',
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 25,
              letterSpacing: TRACK.wide,
              color: INK,
            }}
          >
            {p.cta}
          </div>
        </div>
      </div>

      {/* Bleeds to all three edges — a photo inset inside the margin would read
          as an illustration of the notice rather than part of it. */}
      <div style={{ position: 'relative', display: 'flex', width: W, height: PHOTO_H }}>
        {photo ? (
          <img src={photo} width={W} height={PHOTO_H} style={{ width: W, height: PHOTO_H, objectFit: 'cover' }} alt="" />
        ) : (
          <div style={{ display: 'flex', width: W, height: PHOTO_H, backgroundColor: INK }} />
        )}
      </div>
    </div>
  );
}

/** B. SPLIT — copy column beside a full-height photo. */
function renderSplit(p: Props, ctx: RenderContext) {
  const photo = ctx.img(p.photo);
  const PHOTO_W = 448;
  const COPY_W = W - PHOTO_W;
  const pad = 62;
  const size = headlineSize(words(p.headline), COPY_W - pad * 2, 132);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: W, height: H, backgroundColor: BRAND.cream }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: COPY_W,
          height: H,
          paddingLeft: pad,
          paddingRight: pad,
          paddingTop: 62,
          paddingBottom: 56,
        }}
      >
        <Label size={21} color={BRAND.forest} track={TRACK.widest}>
          {p.eyebrow}
        </Label>

        <div style={{ display: 'flex', marginTop: 24 }}>
          <Headline text={p.headline} size={size} ink={INK} blockText={BRAND.cream} blockGround={INK} />
        </div>

        <div style={{ display: 'flex', marginTop: 28 }}>
          <DoubleRule color={INK} />
        </div>

        <div
          style={{
            display: 'flex',
            fontFamily: FONT.body,
            fontWeight: 600,
            fontSize: 25,
            letterSpacing: TRACK.wide,
            textTransform: 'uppercase',
            color: INK,
            marginTop: 22,
          }}
        >
          {p.subhead}
        </div>

        <div style={{ display: 'flex', flex: 1 }} />

        {/* Stacked, not columns — a 578px column split three ways gives each
            spec 180px, which breaks "Commission, agreed up front" onto four
            lines. */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { i: '01', s: p.stat1, l: p.label1 },
            { i: '02', s: p.stat2, l: p.label2 },
            { i: '03', s: p.stat3, l: p.label3 },
          ].map((row, idx) => (
            <div
              key={row.i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                paddingTop: idx === 0 ? 0 : 20,
                marginTop: idx === 0 ? 0 : 20,
                borderTop: idx === 0 ? '0px solid transparent' : '1px solid rgba(13,27,42,0.18)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline' }}>
                <Label size={18} color={BRAND.forest} track={TRACK.widest}>
                  {row.i}
                </Label>
                <div
                  style={{
                    display: 'flex',
                    fontFamily: FONT.block,
                    fontWeight: 800,
                    fontSize: 46,
                    lineHeight: 1,
                    letterSpacing: TRACK.tight,
                    textTransform: 'uppercase',
                    color: INK,
                    marginLeft: 18,
                  }}
                >
                  {row.s}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  fontFamily: FONT.body,
                  fontSize: 23,
                  lineHeight: 1.3,
                  color: MUTED,
                  marginTop: 6,
                }}
              >
                {row.l}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', height: 52 }} />

        <Signature mark={ctx.img(SCRIPT_NAVY)} color={INK} muted={MUTED} />
        <div
          style={{
            display: 'flex',
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 25,
            letterSpacing: TRACK.wide,
            color: INK,
            marginTop: 14,
          }}
        >
          {p.cta}
        </div>
      </div>

      {/* Forest seam. Without it the photo just stops and the two halves look
          like two files pasted together. */}
      <div style={{ display: 'flex', width: 10, height: H, backgroundColor: BRAND.forest }} />

      <div style={{ display: 'flex', width: PHOTO_W - 10, height: H }}>
        {photo ? (
          <img
            src={photo}
            width={PHOTO_W - 10}
            height={H}
            style={{ width: PHOTO_W - 10, height: H, objectFit: 'cover' }}
            alt=""
          />
        ) : (
          <div style={{ display: 'flex', width: PHOTO_W - 10, height: H, backgroundColor: INK }} />
        )}
      </div>
    </div>
  );
}

/** C. CUTOUT — navy, the hat as the object, copy arranged around it. */
function renderCutout(p: Props, ctx: RenderContext) {
  const hat = ctx.img(p.cutout);
  const pad = 68;
  const size = headlineSize(words(p.headline), W - pad * 2, 168);
  const DISC = 820;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: W,
        height: H,
        backgroundColor: INK,
      }}
    >
      {/* A cream disc behind the cutout. The hat is cream-on-cream, so on navy
          alone its crown floats with no edge to sit against; the disc gives it
          a ground and turns the product into a poster object. */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          top: 430,
          left: (W - DISC) / 2,
          width: DISC,
          height: DISC,
          borderRadius: DISC / 2,
          backgroundColor: BRAND.forest,
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: W,
          height: H,
          paddingLeft: pad,
          paddingRight: pad,
          paddingTop: 62,
          paddingBottom: 54,
        }}
      >
        <Label size={22} color={BRAND.cream} track={TRACK.widest}>
          {p.eyebrow}
        </Label>

        <div style={{ display: 'flex', marginTop: 24 }}>
          <Headline text={p.headline} size={size} ink={BRAND.cream} blockText={INK} blockGround={BRAND.cream} />
        </div>

        <div
          style={{
            display: 'flex',
            fontFamily: FONT.body,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: TRACK.wide,
            textTransform: 'uppercase',
            color: 'rgba(242,239,232,0.78)',
            marginTop: 26,
          }}
        >
          {p.subhead}
        </div>

        <div style={{ display: 'flex', flex: 1 }} />

        <SpecRow
          p={p}
          ink={BRAND.cream}
          muted="rgba(242,239,232,0.72)"
          accent="rgba(242,239,232,0.5)"
          divider="rgba(242,239,232,0.22)"
          total={W - pad * 2}
          statSize={40}
        />

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 30 }}>
          <Signature color={BRAND.cream} muted="rgba(242,239,232,0.6)" />
          <div
            style={{
              display: 'flex',
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 25,
              letterSpacing: TRACK.wide,
              color: BRAND.cream,
            }}
          >
            {p.cta}
          </div>
        </div>
      </div>

      {/* Drawn last so it sits over the disc and the spec rules — the hat
          overlapping the type is what stops this reading as three stacked
          boxes. */}
      {hat ? (
        <img
          src={hat}
          width={812}
          height={551}
          style={{ position: 'absolute', top: 512, left: 134, width: 812, height: 551, objectFit: 'contain' }}
          alt=""
        />
      ) : null}
    </div>
  );
}

export const recruitTemplate = defineTemplate<Props>({
  id: 'brand-recruit',
  name: 'Recruiting Call',
  category: 'brand',
  description: 'Ambassador / rep recruitment notice. Three layouts off one set of copy.',
  canvas: CANVAS.portrait,
  schema,
  fields,
  mock,

  // The navy script is reached by constant, not by a prop, so the renderer's
  // prop-walk can't find it.
  imageRefs: () => [SCRIPT_NAVY],

  // The caption's whole job is to say what the card cannot: why an athlete
  // with 2,000 followers and no NIL deal should care. It never repeats the
  // on-card copy.
  caption: (p) =>
    [
      'Most college athletes never see a dollar of NIL money. The deals go to the'
        + ' handful of names with six figures of following, and everybody else gets'
        + ' told to build a personal brand.',
      '',
      'You already have one. It is the town on the front of the hat.',
      '',
      'If you grew up in Massachusetts and you play anywhere from D1 to D3, we will'
        + ' give you your own code, a rate we agree on before you post anything, and'
        + ' your town’s hat for free. Your people save, you get paid monthly, and you'
        + ' can see what you are owed in your own dashboard.',
      '',
      `Apply: ${p.cta}`,
      '',
      '#NIL #CollegeAthlete #Massachusetts #TowniesNation #RepYourTown #D1 #D2 #D3',
    ].join('\n'),

  render: (p, ctx) => {
    if (p.layout === 'split') return renderSplit(p, ctx);
    if (p.layout === 'cutout') return renderCutout(p, ctx);
    return renderNotice(p, ctx);
  },
});
