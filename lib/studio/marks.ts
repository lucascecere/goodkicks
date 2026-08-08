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
 * The brand pine pattern, tiled to fill a canvas.
 *
 * Path and tile arrangement are lifted verbatim from
 * public/brand/patterns/pine-*.svg so this is the same pattern the site uses,
 * not a lookalike.
 *
 * Generated as ONE canvas-sized SVG with every tree placed explicitly, rather
 * than a 300x300 tile repeated via CSS: Satori cannot use an SVG as a
 * background-image at all, and relying on <pattern> would put the outcome at
 * the mercy of the SVG rasteriser. Explicit <use> elements always render.
 */
export function pinePattern(width: number, height: number, fill: string): string {
  const TILE = 300;
  // x, y, scale — the brand tile's own arrangement.
  const TREES: [number, number, number][] = [
    [60, 70, 0.7],
    [170, 55, 0.52],
    [255, 95, 0.6],
    [40, 200, 0.56],
    [130, 205, 0.72],
    [235, 215, 0.54],
    [90, 135, 0.44],
    [205, 150, 0.48],
  ];

  const uses: string[] = [];
  for (let ty = 0; ty * TILE < height; ty++) {
    for (let tx = 0; tx * TILE < width; tx++) {
      for (const [x, y, scale] of TREES) {
        const px = tx * TILE + x;
        const py = ty * TILE + y;
        // The tree's own centre is (50, 70) in path space, so it is pulled back
        // by that point scaled — exactly what the brand file does.
        uses.push(
          `<use href="#pine" transform="translate(${px} ${py}) translate(${-50 * scale} ${-70 * scale}) scale(${scale})"/>`
        );
      }
    }
  }

  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="${fill}">
      <defs>
        <path id="pine" d="M50 4 L70 46 L60 46 L82 84 L70 84 L92 122 L56 122 L56 138 L44 138 L44 122 L8 122 L30 84 L18 84 L40 46 L30 46 Z"/>
      </defs>
      ${uses.join('')}
    </svg>
  `);
}
