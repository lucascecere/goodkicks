import Image from 'next/image';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { hatStyle, type HatStyle } from '@/lib/townies/towns';
import type { CollectionProduct } from '@/lib/shopify/collections';

/**
 * The two builds as two big tiles with the caption UNDER the picture.
 *
 * The '47 "featured collections" block: a photograph, then a line of type and
 * an underlined link beneath it, rather than copy laid over the image or a
 * bordered card around it. Each tile is the first live product in that build,
 * cropped in on the hat the same way the product cards are, so the two reads
 * as a pair of hats rather than two white squares.
 *
 * Prices are read from the catalogue, never typed here. Renders nothing until
 * both builds are live.
 */
const BUILDS: Array<{ key: HatStyle; name: string; line: string }> = [
  { key: 'lifestyle', name: 'The Lifestyle', line: 'Two-tone twill, slightly structured, pre-curved brim.' },
  { key: 'everyday', name: 'The Everyday', line: 'Solid color, low-profile crown, flat brim.' },
];

function priceLabel(p: CollectionProduct): string | null {
  const amount = p.variants.edges[0]?.node.price.amount;
  return amount ? `$${parseFloat(amount).toFixed(2).replace(/\.00$/, '')}` : null;
}

export function BuildsTiles({ products }: { products: CollectionProduct[] }) {
  const tiles = BUILDS.map((b) => ({
    ...b,
    product: products.find((p) => hatStyle(p.title) === b.key && p.featuredImage?.url) ?? null,
  }));
  if (tiles.some((t) => !t.product)) return null;

  return (
    <section className="bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <SectionHeader
          title="Same town. Two hats."
          sub="Most towns come in both builds. Same embroidery, different crown."
          link={{ href: '/size-guide', label: 'Size guide' }}
        />
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-6 lg:gap-8">
          {tiles.map(({ key, name, line, product }) => (
            <Link key={key} href={`/shop?style=${key}`} className="group block">
              <div className="relative aspect-[5/4] overflow-hidden rounded-sm bg-white border border-rule">
                <Image
                  src={product!.featuredImage!.url}
                  alt={`${product!.title}, the ${name}`}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover scale-[1.12] transition-transform duration-700 group-hover:scale-[1.16]"
                />
              </div>
              <div className="pt-4 flex items-start justify-between gap-6">
                <div>
                  <h3 className="display text-2xl sm:text-[1.75rem] text-text">{name}</h3>
                  <p className="mt-1 text-[0.9375rem] text-muted">{line}</p>
                </div>
                <p className="shrink-0 pt-1 text-[0.9375rem] text-text">
                  {priceLabel(product!) ? `From ${priceLabel(product!)}` : ''}
                </p>
              </div>
              <span className="mt-3 inline-block text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-text transition-colors group-hover:text-muted">
                Shop {name.replace('The ', '')}s
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
