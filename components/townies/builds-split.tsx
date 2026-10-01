import Image from 'next/image';
import Link from 'next/link';
import { hatStyle, type HatStyle } from '@/lib/townies/towns';
import type { CollectionProduct } from '@/lib/shopify/collections';

/**
 * The two builds, as an editorial split on navy.
 *
 * Replaces the pair of white "Pick your fit" cards. The Milton curb photograph
 * shows exactly the two hats this section is about, the cream Lifestyle and the
 * black Everyday, side by side, so it earns the full half of the band rather
 * than a product shot standing in for each. The photograph bleeds to the
 * viewport edge; the copy sits in a measured column on the other side.
 *
 * Prices are read from the catalogue, never typed here. Renders nothing until
 * both builds are live.
 */
const BUILDS: Array<{ key: HatStyle; name: string; line: string; specs: string[] }> = [
  {
    key: 'lifestyle',
    name: 'Lifestyle Hat',
    line: 'Two-tone twill. The one in the photographs.',
    specs: ['Slightly structured 5-panel crown', 'Pre-curved brim', '100% brushed cotton twill'],
  },
  {
    key: 'everyday',
    name: 'Everyday Hat',
    line: 'Solid colour. Sits closer to the head.',
    specs: ['Low-profile unstructured crown', 'Flat brim', '60/40 cotton-poly, soft hand'],
  },
];

function priceFor(products: CollectionProduct[], key: HatStyle): string | null {
  const p = products.find((x) => hatStyle(x.title) === key);
  const amount = p?.variants.edges[0]?.node.price.amount;
  return amount ? `$${parseFloat(amount).toFixed(2).replace(/\.00$/, '')}` : null;
}

export function BuildsSplit({ products }: { products: CollectionProduct[] }) {
  const priced = BUILDS.map((b) => ({ ...b, price: priceFor(products, b.key) }));
  if (priced.some((b) => !b.price)) return null;

  return (
    <section className="bg-ink text-ink-contrast">
      <div className="grid lg:grid-cols-2">
        <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[640px]">
          <Image
            src="/brand/scene/milton-hero-16x10.jpg"
            alt="The Milton Lifestyle Hat and the Milton Everyday Hat side by side on a curb in Milton Village"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex items-center">
          <div className="w-full max-w-xl px-4 py-14 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
            <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-ink-contrast/70 mb-3">
              Two builds
            </p>
            <h2 className="heading text-[2.25rem] sm:text-[2.75rem] lg:text-[3.25rem] leading-[0.95]">
              Same town. Two hats.
            </h2>
            <p className="mt-4 text-base text-ink-contrast/75 max-w-md">
              Most towns come as both. The Lifestyle is the structured two-tone, the Everyday is the
              low-profile solid. Pictured: the two Miltons.
            </p>

            <ul className="mt-10 border-y border-ink-contrast/15 divide-y divide-ink-contrast/15">
              {priced.map((b) => (
                <li key={b.key}>
                  <Link
                    href={`/shop?style=${b.key}`}
                    className="group flex items-start justify-between gap-6 py-6 sm:py-7"
                  >
                    <div className="min-w-0">
                      <h3 className="heading text-xl sm:text-2xl">{b.name}</h3>
                      <p className="mt-1 text-sm text-ink-contrast/75">{b.line}</p>
                      <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-contrast/55">
                        {b.specs.join(' · ')}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="heading text-xl sm:text-2xl">{b.price}</p>
                      <span className="mt-2 inline-block text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-ink-contrast/80 transition-colors group-hover:text-white">
                        Shop {b.name.replace(' Hat', 's')}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/size-guide"
              className="mt-7 inline-block text-[0.6875rem] uppercase tracking-[0.18em] text-ink-contrast/60 underline underline-offset-[6px] decoration-1 transition-colors hover:text-white"
            >
              Size guide
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
