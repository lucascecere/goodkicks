'use client';

// Browser-only image plumbing for the custom hat builder: normalise an upload
// to a PNG data URL, knock out a white background, and render the finished
// SVG mockup to a PNG.

export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];
export const LOGO_MAX_BYTES = 5 * 1024 * 1024;

function readAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image.'));
    img.src = src;
  });
}

function canvasOf(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/**
 * Any accepted upload becomes a PNG data URL no larger than `max` px on its
 * long side. Rasterising SVGs here means the mockup export never has to nest
 * one SVG inside another, which some browsers refuse to paint to a canvas.
 */
export async function normaliseLogo(file: File, max = 1000): Promise<{ src: string; aspect: number }> {
  const raw = await readAsDataURL(file);
  const img = await loadImage(raw);
  // Some SVGs carry no intrinsic size; give them a square canvas to draw into.
  const nw = img.naturalWidth || 800;
  const nh = img.naturalHeight || 800;
  const scale = Math.min(1, max / Math.max(nw, nh));
  const c = canvasOf(nw * scale, nh * scale);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return { src: c.toDataURL('image/png'), aspect: c.width / c.height };
}

/**
 * Make near-white pixels transparent, with a short ramp so edges stay soft.
 * Deliberately simple: it is for logos on a white box, not photo cut-outs.
 */
export async function removeWhite(src: string): Promise<string> {
  const img = await loadImage(src);
  const c = canvasOf(img.naturalWidth, img.naturalHeight);
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const px = data.data;
  const lo = 218;
  const hi = 246;
  for (let i = 0; i < px.length; i += 4) {
    const m = Math.min(px[i], px[i + 1], px[i + 2]);
    if (m >= hi) px[i + 3] = 0;
    else if (m > lo) px[i + 3] = Math.round(px[i + 3] * ((hi - m) / (hi - lo)));
  }
  ctx.putImageData(data, 0, 0);
  return c.toDataURL('image/png');
}

/**
 * Big raster originals would push the request past the host's body limit, so
 * anything over `limit` bytes is re-encoded at a sensible print-preview size.
 * Returns the original file untouched otherwise.
 */
export async function logoForUpload(file: File, limit = 3 * 1024 * 1024): Promise<{ file: Blob; name: string; resized: boolean }> {
  if (file.size <= limit || file.type === 'image/svg+xml') return { file, name: file.name, resized: false };
  const img = await loadImage(await readAsDataURL(file));
  const scale = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = canvasOf(img.naturalWidth * scale, img.naturalHeight * scale);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, type, 0.9));
  if (!blob) return { file, name: file.name, resized: false };
  const base = file.name.replace(/\.[^.]+$/, '');
  return { file: blob, name: `${base}-resized.${type === 'image/jpeg' ? 'jpg' : 'png'}`, resized: true };
}

async function svgToImage(svg: SVGSVGElement, w: number, h: number): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.querySelectorAll('[data-ui="1"]').forEach((n) => n.remove());
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  clone.removeAttribute('class');
  const xml = new XMLSerializer().serializeToString(clone);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  return loadImage(url);
}

/**
 * The mockup as a PNG, 1200px wide: the front view on the studio ground, the
 * side view beside it when there is a side placement, and a caption strip.
 */
export async function renderMockup({
  front,
  side,
  caption,
}: {
  front: SVGSVGElement;
  side?: SVGSVGElement | null;
  caption: string[];
}): Promise<Blob> {
  const W = 1200;
  const both = Boolean(side);
  const viewW = both ? W / 2 : W;
  const viewH = viewW * (500 / 600);
  const capH = 96;
  const c = canvasOf(W, viewH + capH);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#F1EEE8';
  ctx.fillRect(0, 0, c.width, c.height);

  const frontImg = await svgToImage(front, viewW, viewH);
  ctx.drawImage(frontImg, 0, 0, viewW, viewH);
  if (both && side) {
    const sideImg = await svgToImage(side, viewW, viewH);
    ctx.drawImage(sideImg, viewW, 0, viewW, viewH);
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, viewH, W, capH);
  ctx.fillStyle = '#0D1B2A';
  ctx.font = '600 22px Georgia, "Times New Roman", serif';
  ctx.fillText(caption[0] ?? '', 36, viewH + 40);
  ctx.fillStyle = '#5C6168';
  ctx.font = '16px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';
  ctx.fillText(caption[1] ?? '', 36, viewH + 70);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#2F4F3A';
  ctx.font = '600 15px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';
  ctx.fillText('TOWNIES.SHOP', W - 36, viewH + 40);

  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
  if (!blob) throw new Error('Could not render the mockup.');
  return blob;
}
