// Content Studio — one place that turns a template + props into PNG bytes.
//
// Two callers need this: the render route (which streams it to an <img>) and
// the ZIP export (which packs many of them into one download). Before this
// existed the logic lived inline in the route, so the export would have had to
// either duplicate it or make N HTTP round-trips back to our own server.
//
// Anything that affects how a graphic looks — fonts, image pre-resolution,
// canvas size — belongs here, so the preview, the single download and the bulk
// download can never disagree about what a post looks like.

import { ImageResponse } from 'next/og';
import { loadStudioFonts } from './fonts';
import { makeImgResolver, resolveImages } from './images';
import type { AnyTemplate } from './types';

/** Cream variant: the navy original is invisible on the dark fields. */
export const BRAND_MARK = '/brand/logos/script-word-cream.png';

/**
 * Render to PNG bytes.
 *
 * NOTE: `ImageResponse` does its work lazily while the response streams, so
 * errors surface at `arrayBuffer()` time rather than at construction. Callers
 * that need to handle a failure must await this, not just create it.
 */
export async function renderTemplateToPng(
  template: AnyTemplate,
  props: Record<string, unknown>,
  origin: string
): Promise<Uint8Array> {
  const response = await renderTemplateToResponse(template, props, origin);
  return new Uint8Array(await response.arrayBuffer());
}

/**
 * The same render as an `ImageResponse`, for the route that streams it
 * straight to the browser without buffering the whole PNG first.
 */
export async function renderTemplateToResponse(
  template: AnyTemplate,
  props: Record<string, unknown>,
  origin: string
): Promise<ImageResponse> {
  // Images are pre-fetched to data URIs rather than left for Satori to load:
  // Satori throws on a failed image fetch, which would turn one dead logo into
  // a blank graphic instead of a graphic with a fallback chip.
  const [fonts, images] = await Promise.all([
    loadStudioFonts(origin),
    resolveImages(props, origin, [...(template.imageRefs?.(props) ?? []), BRAND_MARK]),
  ]);

  const img = makeImgResolver(images);
  const element = template.render(props, { origin, img, brandMark: img(BRAND_MARK) });

  return new ImageResponse(element, {
    width: template.canvas.width,
    height: template.canvas.height,
    fonts: fonts.map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight,
      style: f.style,
    })),
    headers: {
      // Previews change on every keystroke; caching them would be actively
      // wrong. Export correctness matters more than bandwidth here.
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
