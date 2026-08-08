// Content Studio — Satori-safe building blocks.
//
// These are NOT React components in the usual sense. They are only ever called
// inside an ImageResponse render, where Satori supports a subset of CSS:
//
//   • flexbox only — no grid, no float, no writing-mode
//   • every element with more than one child needs an explicit display:flex
//   • no filter / backdrop-filter / blur — legibility comes from gradients
//   • no CSS variables — the stylesheet is never loaded, inline styles only
//   • images must be data URIs or absolute URLs, pre-resolved by images.ts
//
// Anything reused by two or more templates belongs here, so a change to how
// scrims or info bars look lands everywhere at once instead of drifting.

import type { CSSProperties, ReactNode } from 'react';
import { BRAND, FONT, HAIRLINE, TRACK, TYPE } from '@/lib/studio/design';

/**
 * Strip keys whose value is `undefined`.
 *
 * NOT optional politeness — a real Satori gotcha. React DOM silently ignores
 * `{ top: undefined }`, so the habit of spreading optional style props is safe
 * in normal components. Satori reads the style object directly and tries to
 * parse every key it finds, so an undefined value blows up the whole render
 * with "Cannot read properties of undefined (reading 'trim')" — an error that
 * names no element and points at no line.
 *
 * Any primitive with optional positioning props must run its style through
 * this.
 */
function compact(style: CSSProperties): CSSProperties {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(style)) {
    if (value !== undefined) out[key] = value;
  }
  return out as CSSProperties;
}

/* ------------------------------------------------------------------ scrim */

/**
 * A gradient legibility layer, absolutely positioned. Sits between the photo
 * and a text zone. Every text block in every template gets one — background
 * photos are user-supplied and a bright sky behind white type is unreadable.
 */
export function Scrim({
  image,
  top,
  bottom,
  left,
  right,
  height,
  width,
}: {
  image: string;
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  height?: number | string;
  width?: number | string;
}) {
  return (
    <div
      style={compact({
        position: 'absolute',
        display: 'flex',
        top,
        bottom,
        left,
        right,
        height,
        width,
        backgroundImage: image,
      })}
    />
  );
}

/* -------------------------------------------------------- vertical wordmark */

/**
 * Stacked-letter vertical wordmark for the left rail.
 *
 * Letters are stacked as individual divs rather than rotated with
 * transform: rotate(-90deg). Satori computes a rotated element's bounding box
 * from its UNROTATED dimensions, so a rotated wordmark either clips or throws
 * the layout off by its own length. Stacking is both reliable and gives real
 * control over the vertical rhythm.
 */
export function VerticalWordmark({
  text,
  color,
  accent,
  size = 76,
}: {
  text: string;
  color: string;
  accent?: string;
  size?: number;
}) {
  const letters = text.toUpperCase().split('');

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      {accent ? (
        <div
          style={{
            display: 'flex',
            width: 6,
            height: letters.length * size * 0.86,
            backgroundColor: accent,
            marginRight: 22,
          }}
        />
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {letters.map((letter, i) => (
          <div
            key={`${letter}-${i}`}
            style={{
              display: 'flex',
              fontFamily: FONT.block,
              fontWeight: 800,
              fontSize: size,
              lineHeight: 0.86,
              color,
              letterSpacing: TRACK.tight,
            }}
          >
            {letter}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ labels */

/** Small all-caps label. The connective tissue of every module. */
export function Label({
  children,
  color = 'rgba(255,255,255,0.62)',
  size = TYPE.micro,
  track = TRACK.widest,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
  track?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        fontFamily: FONT.body,
        fontWeight: 600,
        fontSize: size,
        letterSpacing: track,
        textTransform: 'uppercase',
        color,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------- panel */

/** Dark boxed module — the odds card, the fact card, anything framed. */
export function Panel({
  children,
  accent,
  padding = 34,
  width,
}: {
  children: ReactNode;
  accent?: string;
  padding?: number;
  width?: number | string;
}) {
  return (
    <div
      style={compact({
        display: 'flex',
        flexDirection: 'column',
        width,
        padding,
        backgroundColor: 'rgba(4, 10, 18, 0.78)',
        borderLeft: accent ? `6px solid ${accent}` : undefined,
      })}
    >
      {children}
    </div>
  );
}

/** Hairline divider for inside dark modules. */
export function Rule({ margin = 16, color = HAIRLINE }: { margin?: number; color?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        height: 1,
        width: '100%',
        backgroundColor: color,
        marginTop: margin,
        marginBottom: margin,
      }}
    />
  );
}

/* --------------------------------------------------------------- team mark */

/**
 * A team's logo, or its abbreviation on a color chip when the logo could not
 * be fetched. images.ts hands us `undefined` rather than letting a dead CDN
 * take down the whole render, so this fallback is load-bearing, not defensive
 * decoration.
 */
export function TeamMark({
  logo,
  abbr,
  primary,
  onPrimary,
  size = 200,
}: {
  logo?: string;
  abbr: string;
  primary: string;
  onPrimary: string;
  size?: number;
}) {
  if (logo) {
    return (
      <img
        src={logo}
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
        alt=""
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: primary,
        borderRadius: size / 2,
      }}
    >
      <div
        style={{
          display: 'flex',
          fontFamily: FONT.block,
          fontWeight: 800,
          fontSize: size * 0.34,
          color: onPrimary,
          letterSpacing: TRACK.tight,
        }}
      >
        {abbr}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ brand footer */

/**
 * The Townies signature. Script face, small, never competing with the content.
 * Brand-level moment per docs/brand-guidelines.md §2 — script is for signature
 * use only, never a headline.
 */
export function BrandFooter({ color = 'rgba(255,255,255,0.72)', size = 34 }: { color?: string; size?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          fontFamily: FONT.script,
          fontSize: size,
          color,
          paddingBottom: 6,
        }}
      >
        Townies
      </div>
      <div
        style={{
          display: 'flex',
          width: 1,
          height: size * 0.7,
          backgroundColor: color,
          opacity: 0.45,
          marginLeft: 16,
          marginRight: 16,
        }}
      />
      <Label color={color} size={size * 0.46} track={TRACK.wider}>
        Townies Nation
      </Label>
    </div>
  );
}

/* -------------------------------------------------------------- background */

/**
 * Full-bleed background photo plus its base wash. When no photo resolves, the
 * brand navy stands in — a missing image should look intentional, not broken.
 *
 * Takes explicit pixel dimensions rather than using `100%`, and wraps its
 * layers in one sized container. Both matter: an absolutely-positioned <img>
 * sized in percentages renders correctly ALONE, but silently vanishes the
 * moment a scrim sibling is layered over it. Numeric sizes inside a sized
 * wrapper are the construction that holds. Pass the template's canvas.
 */
export function Background({
  image,
  baseScrim,
  width,
  height,
}: {
  image?: string;
  baseScrim: string;
  width: number;
  height: number;
}) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, display: 'flex', width, height }}>
      {image ? (
        <img src={image} width={width} height={height} style={{ width, height, objectFit: 'cover' }} alt="" />
      ) : (
        <div style={{ display: 'flex', width, height, backgroundColor: BRAND.navy }} />
      )}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'flex',
          width,
          height,
          backgroundImage: baseScrim,
        }}
      />
    </div>
  );
}
