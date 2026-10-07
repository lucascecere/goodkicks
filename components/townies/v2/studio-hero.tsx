import Link from 'next/link';
import Image from 'next/image';
import type { CollectionProduct } from '@/lib/shopify/collections';
import { STUDIO_IMG } from './studio';

/**
 * Melin's hero: one hat, big, on a studio sweep, with the line beside it.
 * The sweep is a gradient, the hat is the real Shopify shot multiplied onto
 * it, so it reads as a studio photograph without being one.
 */
export function StudioHero({
  product,
  eyebrow,
  headline,
  sub,
  cta,
  ctaSecondary,
}: {
  product: CollectionProduct | undefined;
  eyebrow: string;
  headline: string;
  sub: string;
  cta: { href: string; label: string };
  ctaSecondary?: { href: string; label: string };
}) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(120%_90%_at_70%_40%,#FBFAF7_0%,#EDEAE3_55%,#E2DED5_100%)]">
      <div className="mx-auto grid max-w-[1320px] items-center gap-4 px-4 pt-8 pb-12 sm:px-8 lg:min-h-[calc(100svh-7.5rem)] lg:max-h-[860px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:py-16">
        <div className="order-2 lg:order-1 max-w-xl animate-[hero-rise_.8s_ease-out_both]">
          <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/70">{eyebrow}</p>
          <h1 className="display mt-4 text-[2.75rem] sm:text-[3.75rem] lg:text-[4.75rem] text-text">{headline}</h1>
          <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-text/75">{sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={cta.href}
              className="font-label bg-text px-8 py-4 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-black"
            >
              {cta.label}
            </Link>
            {ctaSecondary && (
              <Link
                href={ctaSecondary.href}
                className="font-label border border-text px-8 py-4 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-text transition-colors hover:bg-text hover:text-white"
              >
                {ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>
        <div className="order-1 lg:order-2 relative aspect-[5/4] w-full animate-[hero-hat_1.1s_ease-out_both]">
          {product?.featuredImage?.url && (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className={`object-contain ${STUDIO_IMG}`}
            />
          )}
          {/* contact shadow so the hat sits on the sweep instead of floating */}
          <div className="pointer-events-none absolute bottom-[9%] left-1/2 h-[7%] w-[62%] -translate-x-1/2 rounded-[50%] bg-black/10 blur-2xl" />
        </div>
      </div>
    </section>
  );
}
