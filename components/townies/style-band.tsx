import Link from 'next/link';
import Image from 'next/image';
import { SectionHeader } from '@/components/ui/section-header';
import { hatStyle, type HatStyle } from '@/lib/townies/towns';
import type { CollectionProduct } from '@/lib/shopify/collections';

/**
 * The two hats, side by side.
 *
 * Every town comes in up to two builds and the shop never said so — a visitor
 * saw "Milton Lifestyle Hat $29.99" next to "Milton Everyday Hat $24.99" and
 * had to open both to learn that one is a structured two-tone twill and the
 * other a low-profile solid. This is the size guide's comparison, promoted to
 * the homepage, illustrated with whichever real product is live in each style.
 *
 * Prices are read from the catalogue, never typed here.
 */
const STYLES: Array<{
  key: HatStyle;
  name: string;
  line: string;
  specs: string[];
}> = [
  {
    key: 'lifestyle',
    name: 'Lifestyle Hat',
    line: 'Two-tone. The one in the photographs.',
    specs: ['Slightly structured 5-panel crown', 'Pre-curved brim', '100% brushed cotton twill'],
  },
  {
    key: 'everyday',
    name: 'Everyday Hat',
    line: 'Solid colour. Sits closer to the head.',
    specs: ['Low-profile unstructured crown', 'Flat brim', '60/40 cotton-poly, soft hand'],
  },
];

function priceLabel(p: CollectionProduct): string | null {
  const amount = p.variants.edges[0]?.node.price.amount;
  return amount ? `$${parseFloat(amount).toFixed(2).replace(/\.00$/, '')}` : null;
}

export function StyleBand({ products }: { products: CollectionProduct[] }) {
  const examples = STYLES.map((s) => ({
    ...s,
    product: products.find((p) => hatStyle(p.title) === s.key && p.featuredImage?.url) ?? null,
  }));
  // Nothing to show until both styles are live; a one-column comparison is a
  // product card with extra words.
  if (examples.some((e) => !e.product)) return null;

  return (
    <section className="bg-town-cream border-t border-town-rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <SectionHeader
          eyebrow="Two builds"
          title="Pick your fit."
          link={{ href: '/size-guide', label: 'Size guide' }}
        />
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
          {examples.map(({ key, name, line, specs, product }) => (
            <Link
              key={key}
              href={`/shop?style=${key}`}
              className="group grid grid-cols-[42%_1fr] gap-5 sm:gap-7 items-center rounded-sm bg-white border border-town-rule p-4 sm:p-6 transition-colors hover:border-town-navy/40"
            >
              <div className="relative aspect-square bg-white">
                <Image
                  src={product!.featuredImage!.url}
                  alt={`${product!.title} — the ${name}`}
                  fill
                  sizes="(max-width: 640px) 40vw, 25vw"
                  className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div>
                <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-town-forest mb-2">
                  {priceLabel(product!) ? `From ${priceLabel(product!)}` : 'Every town'}
                </p>
                <h3 className="font-block font-bold uppercase text-xl sm:text-2xl leading-none tracking-[0.015em] text-town-navy mb-1.5">
                  {name}
                </h3>
                <p className="text-sm text-town-muted mb-4">{line}</p>
                <ul className="space-y-1 text-[0.8125rem] text-town-navy/80">
                  {specs.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <span aria-hidden className="mt-[0.45rem] h-1 w-1 rounded-full bg-town-forest shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
                <span className="mt-4 inline-block text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-town-navy group-hover:text-town-forest transition-colors">
                  Shop {name.replace(' Hat', '')}s
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
