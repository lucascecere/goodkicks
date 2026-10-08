import type { Metadata } from 'next';
import { CustomHatBuilder } from '@/components/townies/v2/custom/custom-hat-builder';
import { HowItWorks } from '@/components/townies/v2/custom/how-it-works';

const TITLE = 'Custom Embroidered Hats for Massachusetts Businesses | Townies';
const DESCRIPTION =
  'Put your logo on a Townies hat. Pick a Weld, Richardson or Yupoong blank in a real colourway, build a mockup, and get a price for 25 to 200 embroidered hats within two business days.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/custom-hats/build' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/custom-hats/build',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  return (
    <div className="bg-white">
      <section className="bg-[#F1EEE8]">
        <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-8 sm:py-16">
          <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted">
            Custom hats · 25 to 200
          </p>
          <h1 className="display mt-4 text-[2.5rem] text-text sm:text-[3.25rem] lg:text-[4rem]">
            Your logo on a Townies hat.
          </h1>
          <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-muted">
            For Massachusetts businesses, teams, schools and fundraisers. Build a mockup below, send it over, and we
            come back with a price within two business days.
          </p>
        </div>
      </section>

      <CustomHatBuilder howItWorks={<HowItWorks />} />
    </div>
  );
}
