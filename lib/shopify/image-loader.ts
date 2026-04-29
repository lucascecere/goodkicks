'use client';

interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function shopifyImageLoader({ src, width, quality }: ImageLoaderParams): string {
  try {
    const url = new URL(src);
    url.searchParams.set('width', String(width));
    if (quality) {
      url.searchParams.set('quality', String(quality));
    }
    return url.toString();
  } catch {
    return src;
  }
}
