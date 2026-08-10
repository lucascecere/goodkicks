import type { Metadata } from 'next';
import Link from 'next/link';
import { PageMasthead } from '@/components/townies/page-masthead';

export const metadata: Metadata = {
  title: 'Size Guide — Townies',
  description:
    'How Townies hats fit: one size fits most, adjustable snapback, ~55–60cm. Materials and care for the Classic and ZIP snapbacks.',
  alternates: { canonical: '/size-guide' },
};

export default function SizeGuidePage() {
  return (
    <div className="bg-town-cream">
      <PageMasthead
        eyebrow="Fit & care"
        title="Size guide."
        sub={`The short version: one size fits most, and it adjusts. Here's the full picture.`}
        pattern="topo"
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-14 sm:py-20">

        <div className="space-y-10">
          <section>
            <h2 className="font-block uppercase text-2xl text-town-navy mb-3">One size fits most</h2>
            <p className="text-town-muted leading-relaxed">
              Every Townies hat is an <strong>adjustable snapback</strong> with a plastic closure.
              It fits roughly <strong>55–60cm</strong> (about 21.5″–23.5″) of head circumference —
              which covers the large majority of adults. If a standard snapback has fit you before,
              this one will too. No hard sizes to pick, no XS/L guessing.
            </p>
          </section>

          <section>
            <h2 className="font-block uppercase text-2xl text-town-navy mb-3">
              How to check your fit
            </h2>
            <p className="text-town-muted leading-relaxed mb-3">
              Want to be sure? Run a soft tape measure around your head, just above the ears and
              across the middle of your forehead — where a hat actually sits.
            </p>
            <ul className="text-town-muted leading-relaxed list-disc pl-5 space-y-1.5">
              <li>
                <strong>55–60cm:</strong> you&apos;re dead center — the snapback dials right in.
              </li>
              <li>
                <strong>Under 55cm:</strong> still works, tightened to the smaller settings.
              </li>
              <li>
                <strong>Over 60cm:</strong> may run snug at the last setting.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-block uppercase text-2xl text-town-navy mb-3">
              The two builds
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-sm border border-town-rule bg-white/50 p-6">
                <h3 className="font-block uppercase text-lg text-town-navy mb-2">Classic</h3>
                <p className="text-town-muted text-sm leading-relaxed">
                  Two-tone. Slightly structured 5-panel crown, pre-curved brim, 100% brushed cotton
                  twill — soft and broken-in from day one. Mid-profile.
                </p>
              </div>
              <div className="rounded-sm border border-town-rule bg-white/50 p-6">
                <h3 className="font-block uppercase text-lg text-town-navy mb-2">ZIP</h3>
                <p className="text-town-muted text-sm leading-relaxed">
                  Solid color. Low-profile unstructured 5-panel crown, pre-curved brim, 100%
                  polyester — lightweight, sits closer to the head.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-block uppercase text-2xl text-town-navy mb-3">Care</h2>
            <p className="text-town-muted leading-relaxed">
              Spot clean with cold water and a little mild soap, then air dry in shape. Skip the
              washing machine and the dryer — heat and a spin cycle are how a good hat loses its
              shape. Treat it right and it&apos;ll wear in, not out.
            </p>
          </section>
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center bg-town-navy text-town-cream px-7 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-town-navy/90 transition-colors"
          >
            Find your town
          </Link>
        </div>
      </div>
    </div>
  );
}
