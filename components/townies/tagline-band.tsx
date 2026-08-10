import Image from 'next/image';

/**
 * Full-bleed photographic break carrying an official brand tagline.
 *
 * Both lines are the ones printed on the brand sheet — not invented copy. The
 * band exists to give the homepage one wide, quiet moment between two dense
 * shopping sections; without it the page reads as four grids in a row.
 */
export function TaglineBand({
  image = '/brand/lifestyle/split-harbor.jpg',
  alt = 'A South Shore harbour in Massachusetts',
  script = 'Small towns. Strong roots.',
  block = 'Rooted in Massachusetts. Built for every town.',
}: {
  image?: string;
  alt?: string;
  script?: string;
  block?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-town-navy">
      <div className="relative h-[24rem] sm:h-[30rem] lg:h-[34rem]">
        {/* Duotone, not a scrimmed photo. `mix-blend-luminosity` keeps the
            picture's tonal range but takes its colour from the navy behind it,
            so an ordinary snapshot reads as a deliberate brand band instead of
            a washed-out blue rectangle. */}
        <Image
          src={image}
          alt={alt}
          fill
          sizes="100vw"
          className="object-cover object-center grayscale opacity-70 mix-blend-luminosity"
        />
        {/* Vertical falloff so the top and bottom edges sit down against the
            neighbouring sections rather than cutting hard. */}
        <div className="absolute inset-0 bg-gradient-to-b from-town-navy/80 via-town-navy/25 to-town-navy/80" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="font-script text-white text-4xl sm:text-6xl lg:text-7xl leading-[1.05] drop-shadow-[0_2px_18px_rgba(13,27,42,0.45)]">
            {script}
          </p>
          <p className="mt-6 font-block uppercase text-town-cream/85 text-xs sm:text-sm tracking-[0.28em] max-w-2xl">
            {block}
          </p>
        </div>
      </div>
    </section>
  );
}
