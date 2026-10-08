'use client';

import type { KeyboardEvent, PointerEvent, Ref } from 'react';

/**
 * The vector snapback the custom builder draws on. Two views, one geometry
 * system (viewBox 600 x 500), every fill driven by the chosen blank colours.
 *
 * Shading is done with black/white overlays at low opacity rather than baked
 * colours, so the same drawing reads correctly on Natural and on Black. The
 * Everyday (unstructured, low profile) blank is the same drawing with the crown
 * squashed about its base line, which is honestly what the hat looks like next
 * to the Lifestyle.
 *
 * Anything marked data-ui="1" is interface chrome (the dashed drag box) and is
 * stripped before the mockup is rendered to a PNG.
 */

export type HatStyleId = 'lifestyle' | 'everyday';

export type Placed = {
  src: string;
  /** width / height of the artwork */
  aspect: number;
  x: number;
  y: number;
  /** width in viewBox units */
  w: number;
};

export type SideMark =
  | { kind: 'none' }
  | { kind: 'text'; text: string; thread: string; size: number }
  | { kind: 'logo'; logo: Placed };

type Common = {
  id: string;
  style: HatStyleId;
  crown: string;
  brim: string;
  stitched: boolean;
  svgRef?: Ref<SVGSVGElement>;
  crownRef?: Ref<SVGGElement>;
  active?: boolean;
  onLogoPointerDown?: (e: PointerEvent<SVGGElement>) => void;
  onLogoKeyDown?: (e: KeyboardEvent<SVGGElement>) => void;
  className?: string;
};

/* ---------- colour helpers ---------- */

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Mix toward black (amt > 0) or white (amt < 0). */
export function shade(hex: string, amt: number): string {
  const target = amt > 0 ? 0 : 255;
  const a = Math.abs(amt);
  const out = rgb(hex).map((v) => Math.round(v + (target - v) * a));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function seamInk(hex: string) {
  return luminance(hex) < 0.08 ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.28)';
}
function stitchInk(hex: string) {
  return luminance(hex) < 0.08 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)';
}

/* ---------- shared defs ---------- */

function Defs({ id }: { id: string }) {
  return (
    <defs>
      {/* Light from the upper left. */}
      <radialGradient id={`${id}-hi`} cx="0.36" cy="0.26" r="0.62">
        <stop offset="0" stopColor="#fff" stopOpacity="0.30" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-sides`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.30" />
        <stop offset="0.2" stopColor="#000" stopOpacity="0.04" />
        <stop offset="0.62" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.36" />
      </linearGradient>
      <linearGradient id={`${id}-base`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0.6" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.22" />
      </linearGradient>
      <linearGradient id={`${id}-brimtop`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.26" />
        <stop offset="0.35" stopColor="#000" stopOpacity="0.02" />
        <stop offset="0.8" stopColor="#fff" stopOpacity="0.07" />
        <stop offset="1" stopColor="#000" stopOpacity="0.06" />
      </linearGradient>
      <linearGradient id={`${id}-brimsides`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.28" />
        <stop offset="0.25" stopColor="#000" stopOpacity="0" />
        <stop offset="0.75" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.32" />
      </linearGradient>
      <radialGradient id={`${id}-ground`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#3b3326" stopOpacity="0.26" />
        <stop offset="1" stopColor="#3b3326" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-cast`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#000" stopOpacity="0.32" />
        <stop offset="0.6" stopColor="#000" stopOpacity="0.12" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-btn`} cx="0.4" cy="0.3" r="0.7">
        <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
        <stop offset="1" stopColor="#000" stopOpacity="0.25" />
      </radialGradient>
      {/* Embroidery: a tight shadow under the thread plus a faint grain. */}
      <filter id={`${id}-emb`} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceAlpha" stdDeviation="0.9" result="blur" />
        <feOffset in="blur" dx="0.5" dy="1.4" result="off" />
        <feFlood floodColor="#000" floodOpacity="0.38" />
        <feComposite in2="off" operator="in" result="shadow" />
        <feTurbulence type="fractalNoise" baseFrequency="1.6 0.45" numOctaves="1" seed="4" result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.16 0" result="grain" />
        <feComposite in="grain" in2="SourceAlpha" operator="in" result="grainIn" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="grainIn" />
        </feMerge>
      </filter>
    </defs>
  );
}

function Eyelet({ cx, cy, fill }: { cx: number; cy: number; fill: string }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx="5.2" ry="4.6" fill={shade(fill, 0.18)} />
      <ellipse cx={cx} cy={cy} rx="5.2" ry="4.6" fill="none" stroke={stitchInk(fill)} strokeWidth="1.2" strokeDasharray="1.4 1" />
      <ellipse cx={cx} cy={cy + 0.3} rx="2.1" ry="1.8" fill="#000" fillOpacity="0.55" />
    </g>
  );
}

function Logo({
  id,
  clip,
  logo,
  stitched,
  active,
  onPointerDown,
  onKeyDown,
  label,
}: {
  id: string;
  clip: string;
  logo: Placed;
  stitched: boolean;
  active?: boolean;
  onPointerDown?: (e: PointerEvent<SVGGElement>) => void;
  onKeyDown?: (e: KeyboardEvent<SVGGElement>) => void;
  label: string;
}) {
  const h = logo.w / logo.aspect;
  const x = logo.x - logo.w / 2;
  const y = logo.y - h / 2;
  const interactive = Boolean(onPointerDown);
  return (
    <g
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      aria-label={interactive ? label : undefined}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      className={interactive ? 'group/logo cursor-grab outline-none active:cursor-grabbing' : undefined}
      style={interactive ? { touchAction: 'none' } : undefined}
    >
      <g clipPath={`url(#${clip})`}>
        <image
          href={logo.src}
          x={x}
          y={y}
          width={logo.w}
          height={h}
          preserveAspectRatio="xMidYMid meet"
          filter={stitched ? `url(#${id}-emb)` : undefined}
        />
      </g>
      {interactive && (
        <rect
          data-ui="1"
          x={x - 6}
          y={y - 6}
          width={logo.w + 12}
          height={h + 12}
          fill="transparent"
          stroke="#0D1B2A"
          strokeOpacity={active ? 0.55 : 0}
          strokeWidth="1.2"
          strokeDasharray="4 4"
          className="transition-[stroke-opacity] group-hover/logo:[stroke-opacity:0.4] group-focus-visible/logo:[stroke-opacity:0.8]"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </g>
  );
}

/* ---------- front view ---------- */

// Crown base runs along Q(108,332)-(300,400)-(492,332); the front panel's base
// is the matching sub-segment of that curve so the two meet without a gap.
const F_CROWN = 'M106,338 C100,236 168,140 292,132 C420,140 500,236 494,338 Q300,404 106,338 Z';
const F_FRONT = 'M160,354 C150,268 194,166 290,136 C384,164 422,268 412,360 Q286,385 160,354 Z';
const F_SEAM_L = 'M160,354 C150,268 194,166 290,136';
const F_SEAM_R = 'M290,136 C384,164 422,268 412,360';
const F_SEAM_BACK_R = 'M300,136 C408,156 474,236 480,344';
const F_SEAM_BACK_L = 'M284,136 C194,154 130,232 122,342';
const F_BRIM = 'M92,342 Q300,372 508,342 C532,374 450,448 298,454 C148,450 62,380 92,342 Z';
const F_BRIM_EDGE = 'M92,342 C62,380 148,450 298,454 C450,448 532,374 508,342';

/** Front logo bounds (centre point), in crown-group units. */
export const FRONT_BOUNDS = { minX: 195, maxX: 380, minY: 185, maxY: 335, minW: 50, maxW: 210 };
export const SIDE_BOUNDS = { cx: 350, cy: 252, minW: 30, maxW: 120 };

export function crownSquash(style: HatStyleId, baseY: number) {
  // Everyday is low profile: same footprint, roughly 12% less crown height.
  return style === 'everyday' ? `translate(0 ${(baseY * 0.12).toFixed(2)}) scale(1 0.88)` : undefined;
}

export function FrontHat({
  id,
  style,
  crown,
  brim,
  stitched,
  logo,
  svgRef,
  crownRef,
  active,
  onLogoPointerDown,
  onLogoKeyDown,
  className,
}: Common & { logo: Placed | null }) {
  const brimEdge = shade(brim, 0.38);
  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 500"
      className={className}
      role="img"
      aria-label={`Front view of a ${style === 'lifestyle' ? 'Lifestyle' : 'Everyday'} hat`}
    >
      <Defs id={id} />
      <clipPath id={`${id}-frontclip`}>
        <path d={F_FRONT} />
      </clipPath>
      <clipPath id={`${id}-brimclip`}>
        <path d={F_BRIM} />
      </clipPath>
      <clipPath id={`${id}-crownclip`}>
        <path d={F_CROWN} />
      </clipPath>

      <ellipse cx="300" cy="468" rx="240" ry="14" fill={`url(#${id}-ground)`} />

      {/* Brim: underside lip first, then the top surface. */}
      <path d={F_BRIM} transform="translate(0 7)" fill={brimEdge} />
      <path d={F_BRIM} fill={brim} />
      <g clipPath={`url(#${id}-brimclip)`}>
        <rect x="60" y="320" width="480" height="170" fill={`url(#${id}-brimtop)`} />
        <rect x="60" y="320" width="480" height="170" fill={`url(#${id}-brimsides)`} />
        {/* Rows of brim stitching, following the edge inward. */}
        {[
          [0.965, 0.94],
          [0.93, 0.88],
          [0.895, 0.82],
          [0.86, 0.76],
          [0.825, 0.7],
        ].map(([sx, sy], i) => (
          <path
            key={i}
            d={F_BRIM_EDGE}
            fill="none"
            stroke={stitchInk(brim)}
            strokeWidth="1.1"
            strokeDasharray="3.2 2.6"
            transform={`translate(300 350) scale(${sx} ${sy}) translate(-300 -350)`}
          />
        ))}
        {/* The crown's shadow falling on the brim. */}
        <ellipse cx="292" cy="372" rx="250" ry="44" fill={`url(#${id}-cast)`} />
      </g>
      <path d={F_BRIM_EDGE} fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="1.2" />

      <g ref={crownRef} transform={crownSquash(style, 338)}>
        <path d={F_CROWN} fill={crown} />
        <path d={F_FRONT} fill={shade(crown, -0.03)} />

        {logo && (
          <Logo
            id={id}
            clip={`${id}-frontclip`}
            logo={logo}
            stitched={stitched}
            active={active}
            onPointerDown={onLogoPointerDown}
            onKeyDown={onLogoKeyDown}
            label="Your logo. Drag, or use the arrow keys, to move it."
          />
        )}

        {/* Light and shade over everything, logo included, so the art sits in the fabric. */}
        <g clipPath={`url(#${id}-crownclip)`} pointerEvents="none">
          <rect x="90" y="110" width="420" height="310" fill={`url(#${id}-sides)`} />
          <rect x="90" y="110" width="420" height="310" fill={`url(#${id}-hi)`} />
          <rect x="90" y="110" width="420" height="310" fill={`url(#${id}-base)`} />
        </g>

        <g fill="none" pointerEvents="none" strokeLinecap="round">
          <path d={F_SEAM_BACK_L} stroke={seamInk(crown)} strokeOpacity="0.6" strokeWidth="1.2" />
          <path d={F_SEAM_BACK_R} stroke={seamInk(crown)} strokeWidth="1.4" />
          <path d={F_SEAM_L} stroke={seamInk(crown)} strokeWidth="1.6" />
          <path d={F_SEAM_R} stroke={seamInk(crown)} strokeWidth="1.6" />
          <path d={F_SEAM_L} transform="translate(-7 1)" stroke={stitchInk(crown)} strokeWidth="1.1" strokeDasharray="3.2 2.6" />
          <path d={F_SEAM_R} transform="translate(7 1)" stroke={stitchInk(crown)} strokeWidth="1.1" strokeDasharray="3.2 2.6" />
          <path d={F_SEAM_BACK_R} transform="translate(-6 2)" stroke={stitchInk(crown)} strokeWidth="1" strokeDasharray="3.2 2.6" />
          {/* Sweatband line where the crown meets the brim. */}
          <path d="M110,344 Q300,408 490,344" stroke="#000" strokeOpacity="0.22" strokeWidth="2" />
        </g>

        <g pointerEvents="none">
          <Eyelet cx={140} cy={236} fill={crown} />
          <Eyelet cx={444} cy={228} fill={crown} />
          {/* Top button. */}
          <ellipse cx="292" cy="136" rx="15" ry="7.5" fill={shade(crown, 0.12)} />
          <ellipse cx="292" cy="134" rx="14" ry="6.5" fill={crown} />
          <ellipse cx="292" cy="134" rx="14" ry="6.5" fill={`url(#${id}-btn)`} />
        </g>
      </g>
    </svg>
  );
}

/* ---------- side view (facing left) ---------- */

const S_CROWN = 'M176,340 C166,236 226,140 330,128 C430,120 500,200 504,334 Q340,356 176,340 Z';
const S_SIDE_PANEL = 'M246,345 C242,262 270,170 332,129 C416,150 452,232 452,338 Q350,350 246,345 Z';
const S_SEAM_F = 'M246,345 C242,262 270,170 332,129';
const S_SEAM_B = 'M332,129 C416,150 452,232 452,338';
const S_BRIM_TOP = 'M206,334 C160,334 98,346 30,370 C34,377 44,380 56,378 C120,362 170,346 208,341 Z';
const S_BRIM_UNDER = 'M30,370 C34,384 50,388 66,386 C128,372 176,350 210,344 L208,341 C170,346 120,362 56,378 C44,380 34,377 30,370 Z';

export function SideHat({
  id,
  style,
  crown,
  brim,
  stitched,
  mark,
  svgRef,
  className,
}: Common & { mark: SideMark }) {
  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 500"
      className={className}
      role="img"
      aria-label={`Side view of a ${style === 'lifestyle' ? 'Lifestyle' : 'Everyday'} hat`}
    >
      <Defs id={id} />
      <clipPath id={`${id}-sideclip`}>
        <path d={S_SIDE_PANEL} />
      </clipPath>
      <clipPath id={`${id}-scrownclip`}>
        <path d={S_CROWN} />
      </clipPath>

      <ellipse cx="290" cy="398" rx="270" ry="13" fill={`url(#${id}-ground)`} />

      {/* Brim first: its root tucks under the crown and it emerges at the front. */}
      <path d={S_BRIM_UNDER} fill={shade(brim, 0.4)} />
      <path d={S_BRIM_TOP} fill={brim} />
      <path d={S_BRIM_TOP} fill="#fff" fillOpacity="0.08" />
      <path d="M200,338 C160,339 100,350 40,371" fill="none" stroke={stitchInk(brim)} strokeWidth="1.1" strokeDasharray="3.2 2.6" />
      <path d="M202,342 C164,345 108,358 50,376" fill="none" stroke={stitchInk(brim)} strokeWidth="1.1" strokeDasharray="3.2 2.6" />
      <g transform={crownSquash(style, 340)}>
        <path d={S_CROWN} fill={crown} />

        {mark.kind === 'logo' && (
          <Logo id={id} clip={`${id}-sideclip`} logo={mark.logo} stitched={stitched} label="Side logo" />
        )}
        {mark.kind === 'text' && mark.text.trim() && (
          <g clipPath={`url(#${id}-sideclip)`}>
            <text
              x={SIDE_BOUNDS.cx}
              y={SIDE_BOUNDS.cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={mark.thread}
              fontFamily="Rockwell, 'Roboto Slab', Georgia, 'Times New Roman', serif"
              fontWeight="700"
              fontSize={mark.size}
              letterSpacing="1"
              filter={stitched ? `url(#${id}-emb)` : undefined}
            >
              {mark.text.trim().slice(0, 18)}
            </text>
          </g>
        )}

        <g clipPath={`url(#${id}-scrownclip)`} pointerEvents="none">
          <rect x="160" y="110" width="360" height="260" fill={`url(#${id}-sides)`} opacity="0.7" />
          <rect x="160" y="110" width="360" height="260" fill={`url(#${id}-hi)`} />
          <rect x="160" y="110" width="360" height="260" fill={`url(#${id}-base)`} />
          {/* Snapback opening at the back. */}
          <path d="M470,342 C470,318 484,308 506,312 L510,342 Z" fill="#000" fillOpacity="0.3" />
        </g>

        <g fill="none" pointerEvents="none" strokeLinecap="round">
          <path d={S_SEAM_F} stroke={seamInk(crown)} strokeWidth="1.6" />
          <path d={S_SEAM_B} stroke={seamInk(crown)} strokeWidth="1.6" />
          <path d={S_SEAM_F} transform="translate(-7 0)" stroke={stitchInk(crown)} strokeWidth="1.1" strokeDasharray="3.2 2.6" />
          <path d={S_SEAM_B} transform="translate(7 0)" stroke={stitchInk(crown)} strokeWidth="1.1" strokeDasharray="3.2 2.6" />
          <path d="M182,337 Q340,352 500,332" stroke="#000" strokeOpacity="0.22" strokeWidth="2" />
        </g>
        <Eyelet cx={356} cy={172} fill={crown} />
        <ellipse cx="331" cy="129" rx="9" ry="5" fill={shade(crown, 0.1)} />
        <ellipse cx="331" cy="128" rx="8" ry="4.2" fill={`url(#${id}-btn)`} />
      </g>

    </svg>
  );
}
