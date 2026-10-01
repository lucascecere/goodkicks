import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { EditorialSplit } from '@/components/townies/editorial-split';
import { BrandLogo } from '@/components/brand/brand-logo';
import { BrandPattern } from '@/components/townies/brand-pattern';

export const metadata: Metadata = {
  title: { absolute: 'About Townies Apparel Co. | Town-Pride Hats from Massachusetts' },
  description:
    'The town is the hero, Townies is the label. How a Massachusetts apparel brand — made by Massholes, for Massholes — started on the South Shore and grew out of Good Kicks.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Townies — Town-Pride Apparel from Massachusetts',
    description: 'The town is the hero, Townies is the label.',
    url: '/about',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 630 }],
  },
};

export default function AboutPage() {
  return (
    <div className="bg-bg">
      {/* Masthead. Duotone rather than a scrimmed photo, matching the homepage
          tagline band — the About page used to open with centred text on flat
          cream, which gave the story no ground to start from. */}
      <section className="relative isolate overflow-hidden bg-ink">
        <Image
          src="/brand/scene/clover-2-1x1.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center grayscale opacity-60 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/35 to-ink/90" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-8 py-20 sm:py-28 text-center">
          <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-ink-contrast/70 mb-4">
            Made by Massholes
          </p>
          <p className="font-script text-ink-contrast/90 text-2xl sm:text-3xl leading-none mb-1">
            Rep your town —
          </p>
          <h1 className="display text-[2.5rem] sm:text-[3.25rem] lg:text-[4rem] text-white mb-5">
            The town is the hero.
          </h1>
          <p className="text-ink-contrast/85 leading-relaxed text-lg">
            We make one thing, and we make it right: apparel that puts your hometown front and
            center — not a logo, not a state-shape cliché. The town&apos;s the headline. Townies is
            just the little tag that says it&apos;s built to last.
          </p>
        </div>
      </section>

      <EditorialSplit
        eyebrow="The principle"
        headline="Town first. Always."
        body="No loud logos. No 'Massachusetts' slapped across your chest like you're passing through. Just where you're from, set in clean collegiate type on hats you'll wear 'til they fall apart. The MA mark stays small — the quiet thread tying every town together."
        cta={{ href: '/shop', label: 'see the towns' }}
        imageSrc="/brand/product/mil-turn25.jpg"
        imageAlt="Milton snapback showing the arched wordmark and the 1640 side embroidery"
        imageLabel="Townies"
        tone="cream"
      />

      <EditorialSplit
        eyebrow="Our sister brand"
        headline="Good Kicks taught us how."
        body="Before Townies there was Good Kicks — hand-stitched foot bags built to keep the circle going. Small, scrappy, and it taught us how to make something people actually keep instead of toss. Good Kicks is still kicking, a live line of its own — and Townies is what grew out of it."
        cta={{ href: '/goodkicks', label: 'shop good kicks' }}
        imageSrc="/brand/product/gk-sack-massachusetts.jpg"
        imageFit="contain"
        imageAlt="Good Kicks hand-stitched Massachusetts foot bag"
        imageLabel="Good Kicks"
        reverse
        tone="cream"
      />

      {/* Mission */}
      <section className="relative overflow-hidden bg-ink text-ink-contrast">
        <BrandPattern variant="ma" color="cream" opacity={0.05} size={240} fade="radial" />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-8 py-16 sm:py-24 text-center">
        <BrandLogo variant="script-cream" className="w-64 sm:w-80 h-auto mx-auto mb-8" />
        <p className="display text-[2.25rem] sm:text-[3rem] text-ink-contrast mb-5">
          Small towns. Strong roots.
        </p>
        <p className="text-ink-contrast/75 text-base leading-relaxed mb-10">
          We&apos;re not trying to be the biggest brand in New England. We&apos;re trying to be the
          one your town actually wears — the hat at the reunion, the one on your head all
          summer, the one that says exactly where you&apos;re from before you open your mouth.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center bg-ink-contrast text-ink px-7 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-white transition-colors"
        >
          Find your town
        </Link>
        </div>
      </section>
    </div>
  );
}
