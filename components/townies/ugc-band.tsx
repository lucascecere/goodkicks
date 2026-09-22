'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { UGC, type UgcPost } from '@/lib/townies/reviews';

/**
 * Customer photography, as a rail.
 *
 * RENDERS NOTHING UNTIL THERE ARE REAL PHOTOS. There is no worn-hat photography
 * on this site at all — every image in `public/brand` is a product on a sweep
 * or a hat on a street — so this is a slot, not a section, until the first one
 * arrives. Drop files in `public/brand/ugc/` and list them in
 * `lib/townies/reviews.ts`.
 *
 * Nothing generated, and nothing lifted from a customer's feed without their
 * say-so: the `credit` field exists because a reposted photo needs a name on it.
 */
export function UgcBand({
  posts = UGC,
  eyebrow = 'Out in the wild',
  title = 'Worn where it’s from.',
}: {
  posts?: UgcPost[];
  eyebrow?: string;
  title?: string;
}) {
  const rail = useRef<HTMLDivElement>(null);
  if (posts.length === 0) return null;

  const scroll = (dir: -1 | 1) => {
    const el = rail.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="bg-ink py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-ink-contrast/70 mb-2">
              {eyebrow}
            </p>
            <h2 className="heading text-3xl sm:text-4xl lg:text-[2.75rem] leading-[0.95] text-white">
              {title}
            </h2>
          </div>
          <div className="flex items-center justify-center gap-2">
            {([-1, 1] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => scroll(dir)}
                aria-label={dir === -1 ? 'Scroll left' : 'Scroll right'}
                className="grid h-8 w-8 place-items-center rounded-full border border-ink-contrast/30 text-ink-contrast transition-colors hover:bg-ink-contrast hover:text-ink"
              >
                {dir === -1 ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={rail}
        className="mt-8 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-8 px-4 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((post) => {
          const card = (
            <>
              <Image
                src={post.src}
                alt={post.alt}
                fill
                sizes="(min-width: 1024px) 320px, 70vw"
                className="object-cover"
              />
              {(post.quote || post.credit) && (
                <>
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/85 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    {post.quote && (
                      <p className="text-xs leading-relaxed">“{post.quote}”</p>
                    )}
                    {post.credit && (
                      <p className="mt-1.5 text-[0.625rem] uppercase tracking-[0.16em] text-white/70">
                        {post.credit}
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          );
          const shell =
            'relative w-[70vw] sm:w-[300px] lg:w-[320px] shrink-0 snap-start aspect-[4/5] overflow-hidden rounded-sm bg-ink-contrast/10';
          return post.href ? (
            <Link key={post.src} href={post.href} className={shell} target="_blank" rel="noopener noreferrer">
              {card}
            </Link>
          ) : (
            <div key={post.src} className={shell}>
              {card}
            </div>
          );
        })}
      </div>
    </section>
  );
}
