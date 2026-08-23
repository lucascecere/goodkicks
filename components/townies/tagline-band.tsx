import Image from 'next/image';
import { BrandPattern } from './brand-pattern';

/**
 * The quiet moment between two dense shopping sections, carrying an official
 * brand tagline. Both lines are printed on the brand sheet — not invented copy.
 *
 * `image` now defaults to NULL and the band renders on pattern instead.
 *
 * It used to default to a stock harbour photo run through
 * `grayscale mix-blend-luminosity` over navy. That treatment existed to make an
 * anonymous stock picture look deliberate, and docs/brand-guidelines.md §9
 * explicitly forbids heavily tinting photography. A pattern ground is the
 * honest version of the same idea: this section was never about a picture, it
 * is about two lines of type. Pass `image` when a real shoot exists and the
 * duotone branch below lights back up.
 */
export function TaglineBand({
  image = null,
  alt = '',
  script = 'Small towns. Strong roots.',
  block = 'Rooted in Massachusetts. Built for every town.',
}: {
  image?: string | null;
  alt?: string;
  script?: string;
  block?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-town-navy py-16 sm:py-24">
      {image ? (
        <>
          {/* Duotone, not a scrimmed photo. `mix-blend-luminosity` keeps the
              picture's tonal range but takes its colour from the navy behind
              it. Only reach for this with a real shoot — it was invented to
              rescue stock. */}
          <Image
            src={image}
            alt={alt}
            fill
            sizes="100vw"
            className="object-cover object-center grayscale opacity-70 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-town-navy/80 via-town-navy/25 to-town-navy/80" />
        </>
      ) : (
        <BrandPattern variant="topo" color="cream" opacity={0.09} size={260} fade="radial" />
      )}

      <div className="relative flex flex-col items-center justify-center text-center px-6">
        {/* The one place the script signature is spent on this page. */}
        <p className="font-script text-white text-2xl sm:text-3xl lg:text-4xl leading-[1.05]">
          {script}
        </p>
        <p className="mt-5 font-block uppercase text-town-cream/80 text-[0.625rem] tracking-[0.22em] font-medium max-w-2xl">
          {block}
        </p>
      </div>
    </section>
  );
}
