// Content Studio — vector marks, inlined as data URIs.
//
// Satori will not load an external SVG file and cannot use SVG as a CSS
// background; a data URI in an <img> is the one path that works. These are
// built as strings so the fill colour is baked in per use — Satori has no
// currentColor and no CSS filters, so recolouring at render time isn't an
// option.
//
// Drawn generically on purpose. A real school's logo is that district's
// trademark, and putting one on merchandise marketing is a legal problem, not
// a design decision. A paw reads as "Wildcats" without borrowing anyone's mark.

function svgDataUri(svg: string): string {
  // encodeURIComponent rather than base64: no Buffer needed, so this stays
  // usable from anywhere, and the output is debuggable by eye.
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

/**
 * Wildcat paw print — four toes over a heel pad.
 *
 * `fill` should carry its own alpha (e.g. `rgba(255,255,255,0.15)`); baking the
 * transparency into the fill avoids relying on Satori honouring `opacity` on an
 * image element.
 */
export function pawMark(fill: string): string {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <g fill="${fill}">
        <ellipse cx="21" cy="47" rx="10" ry="13.5" transform="rotate(-18 21 47)"/>
        <ellipse cx="38.5" cy="31" rx="10.5" ry="14.5" transform="rotate(-7 38.5 31)"/>
        <ellipse cx="61.5" cy="31" rx="10.5" ry="14.5" transform="rotate(7 61.5 31)"/>
        <ellipse cx="79" cy="47" rx="10" ry="13.5" transform="rotate(18 79 47)"/>
        <path d="M50 94c-15.5 0-26.5-8.6-26.5-19.4 0-11.4 9.6-22.6 26.5-22.6s26.5 11.2 26.5 22.6C76.5 85.4 65.5 94 50 94z"/>
      </g>
    </svg>
  `);
}

/**
 * The brand pine — redrawn from the pine swatch on the brand sheet.
 *
 * The sheet's tree is LINE ART: a cream outline conifer with a central trunk
 * and angled branch tiers that widen toward the base, drawn with rounded caps
 * so it reads hand-made. It is NOT the solid zigzag triangle in
 * public/brand/pine.svg — that file is a different, wrong shape, and anything
 * built from it is off-brand.
 *
 * Returned as raw <path> markup so both the single icon and the pattern share
 * one definition of the tree.
 */
function pineTreePaths(): string {
  // Six tiers, widening as they descend, each a pair of strokes angled down
  // and out from the trunk.
  // Narrower and more steeply angled than a first pass suggested: on the sheet
  // the boughs fall roughly 30 degrees below horizontal and the widest tier is
  // under half the tree's height. Flatter, wider branches read as a stack of
  // bars rather than a conifer.
  const TIERS: [number, number][] = [
    [24, 8],
    [38, 12],
    [52, 16],
    [66, 20],
    [80, 24],
    [94, 28],
  ];
  const DROP = 15;

  const branches = TIERS.map(
    ([y, halfWidth]) =>
      `<path d="M50 ${y} L${50 - halfWidth} ${y + DROP}"/><path d="M50 ${y} L${50 + halfWidth} ${y + DROP}"/>`
  ).join('');

  return `<path d="M50 10 L50 116"/>${branches}`;
}

/** A single pine, sized to a box, for icon use. */
export function pineMark(stroke: string, strokeWidth = 5): string {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120"
         fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"
         stroke-linecap="round" stroke-linejoin="round">
      ${pineTreePaths()}
    </svg>
  `);
}


/**
 * The brand pine pattern.
 *
 * A STRICT staggered grid: one size, exact spacing, odd rows offset by exactly
 * half a column. It used to jitter both size and position to mimic the brand
 * sheet's hand-drawn swatch, and the result read as clustered and random every
 * time. Evenness is the brief — do not reintroduce variation here.
 *
 * Generated as one canvas-sized SVG: Satori cannot use an SVG as a CSS
 * background, so tiling is not available.
 */
export function pinePattern(
  width: number,
  height: number,
  stroke: string,
  /** Nominal tree height in px. Defaults to a density suiting a 1080 canvas. */
  treeHeight?: number
): string {
  const treeH = treeHeight ?? Math.max(38, Math.round(height * 0.088));
  const treeW = treeH * (100 / 120);

  // Even cells, no jitter. This pattern previously varied each tree's size
  // between 0.72x and 1.12x of nominal and shifted it up to a third of a cell
  // in each axis, which made trees cluster and collide and read as noise
  // rather than as a pattern. It is a strict staggered grid now: ONE size,
  // exact spacing, odd rows offset by exactly half a column.
  const cellW = treeH * 0.95;
  const cellH = treeH * 1.15;

  const trees: string[] = [];
  const cols = Math.ceil(width / cellW) + 2;
  const rows = Math.ceil(height / cellH) + 2;
  const scale = (treeW / 100).toFixed(4);
  const scaleY = (treeH / 120).toFixed(4);

  for (let row = -1; row < rows; row++) {
    const stagger = row % 2 === 0 ? 0 : cellW / 2;
    for (let col = -1; col < cols; col++) {
      const x = col * cellW + stagger;
      const y = row * cellH;

      trees.push(
        `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale} ${scaleY})">${pineTreePaths()}</g>`
      );
    }
  }

  // Stroke width is a constant in the tree's own coordinate space, so it
  // scales with each tree and stays visually proportional. Deliberately NOT
  // vector-effect="non-scaling-stroke" — support for that depends on the SVG
  // rasteriser, and a silently ignored attribute would give every tree a
  // different line weight.
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"
         fill="none" stroke="${stroke}" stroke-width="5"
         stroke-linecap="round" stroke-linejoin="round">
      ${trees.join('')}
    </svg>
  `);
}

/**
 * The Massachusetts silhouette from the brand kit.
 *
 * Path lifted verbatim from public/brand/ma-shape.svg — the accurate outline
 * with the Cape hook and the islands, not a traced approximation. Its viewBox
 * is inherited from the source artboard, which is why the numbers look
 * arbitrary; leaving them alone keeps the proportions exact.
 */
export function maMark(fill: string): string {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="843.7 142.3 60.6 32.6">
      <path fill="${fill}" d="M899.6,173.2L901.7,172.5L902.2,170.8L903.2,170.9L904.3,173.2L903,173.7L899.1,173.8L899.6,173.2zM890.2,174L892.5,171.4L894.1,171.4L895.9,172.9L893.5,173.9L891.3,174.9L890.2,174zM855.4,152L873,147.4L875.3,146.7L877.2,143.9L881,142.3L883.9,146.7L881.4,151.9L881.1,153.3L883,155.9L884.2,155.1L886,155.1L888.2,157.7L892.1,163.7L895.7,164.1L897.9,163.2L899.7,161.4L898.9,158.6L896.8,157L895.3,157.8L894.4,156.5L894.8,156.1L896.9,155.9L898.7,156.7L900.7,159.1L901.6,162L902,164.5L897.8,165.9L893.9,167.9L890,172.4L888.1,173.8L888.1,172.9L890.5,171.4L891,169.6L890.2,166.6L887.2,168L886.4,169.5L886.9,171.7L884.9,172.7L882.1,168.2L878.7,163.8L876.6,162L870.1,163.9L865,165L844.3,169.6L843.7,164.8L844.3,154.2L848.6,153.3L855.4,152z"/>
    </svg>
  `);
}
