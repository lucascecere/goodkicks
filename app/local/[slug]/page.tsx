import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AtSign, Globe, MapPin, Store } from 'lucide-react';
import { getStall } from '@/lib/shop/market';
import { marketOpen } from '@/lib/shop/config';
import { MARKET_BASE } from '@/lib/shop/paths';
import { dollars, WHOLESALE_LABEL } from '@/lib/shop/money';
import { SellerMark } from '@/components/market/seller-mark';
import { AddToBag } from '@/components/market/add-to-bag';
import { Awning, awningTone } from '@/components/market/awning';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const stall = await getStall(slug);
  if (!stall) return {};
  const { seller } = stall;
  const title = `${seller.name} Hats${seller.town ? `, ${seller.town}` : ''}`;
  // Blurbs can be one short line, so the description always says what the page is.
  const description = `${seller.name}${seller.town ? ` in ${seller.town}` : ''} hats, embroidered by Townies. ${seller.blurb ?? ''}`.trim().slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `${MARKET_BASE}/${seller.slug}` },
    openGraph: { title: `${title} | Townies`, description, url: `${MARKET_BASE}/${seller.slug}`, images: seller.logo_url ? [seller.logo_url] : undefined },
  };
}

function instagramUrl(handle: string): string {
  return handle.startsWith('http') ? handle : `https://instagram.com/${handle.replace(/^@/, '')}`;
}

export default async function StallPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stall = await getStall(slug);
  if (!stall) notFound();
  const { seller, hats } = stall;
  const open = marketOpen();

  // Product + Offer markup so each hat can show in Google with its price.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': hats.map((h) => ({
      '@type': 'Product',
      name: `${seller.name} ${h.title}`,
      description: h.description ?? `${seller.name} embroidered snapback, made by Townies.`,
      image: h.image_url?.startsWith('http') ? h.image_url : undefined,
      brand: { '@type': 'Brand', name: seller.name },
      offers: {
        '@type': 'Offer',
        price: (h.price_cents! / 100).toFixed(2),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `https://townies.shop${MARKET_BASE}/${seller.slug}`,
        seller: { '@type': 'Organization', name: 'Townies' },
      },
    })),
  };

  return (
    <>
      {open && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />}
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center lg:gap-16">
          {seller.cover_url && (
            // Shop photos are mostly upright phone shots, so they sit upright
            // beside the name rather than cropped into a wide banner.
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F1EEE8] lg:order-last">
              <Awning tone={awningTone(seller.slug)} band={10} stripe={18} className="absolute inset-x-0 top-0 z-10" />
              <Image src={seller.cover_url} alt={seller.name} fill priority sizes="(max-width: 1024px) 100vw, 400px" className="object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <Link href={MARKET_BASE} className="mb-8 inline-block font-label text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-muted hover:text-text">
              ← The Local Market
            </Link>
            <SellerMark seller={seller} size={88} />
            <h1 className="display mt-5 text-[2.25rem] leading-none text-text sm:text-[3.25rem]">{seller.name}</h1>
            {seller.blurb && <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-muted">{seller.blurb}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text">
              {seller.town && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted" strokeWidth={1.75} /> {seller.town}
                </span>
              )}
              {seller.pickup_enabled && (
                <span className="flex items-center gap-1.5">
                  <Store className="h-4 w-4 text-muted" strokeWidth={1.75} /> Free pickup at the shop
                </span>
              )}
              {seller.website && (
                <a href={seller.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 underline-offset-4 hover:underline">
                  <Globe className="h-4 w-4 text-muted" strokeWidth={1.75} /> Website
                </a>
              )}
              {seller.instagram && (
                <a href={instagramUrl(seller.instagram)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 underline-offset-4 hover:underline">
                  <AtSign className="h-4 w-4 text-muted" strokeWidth={1.75} /> Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
        <p className="mb-6 font-label text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-muted">
          The hats · {hats.length} hat{hats.length === 1 ? '' : 's'}
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {hats.map((h, i) => (
            <div key={h.id} className="flex flex-col">
              <div className="relative aspect-square overflow-hidden bg-[#F1EEE8]">
                {h.image_url && (
                  <Image
                    src={h.image_url}
                    alt={`${seller.name} ${h.title}`}
                    fill
                    priority={i < 4}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-[6%] mix-blend-multiply"
                  />
                )}
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <p className="text-[0.9375rem] font-semibold leading-snug text-text">{h.title}</p>
                {open && <p className="shrink-0 text-[0.9375rem] text-text">{dollars(h.price_cents!)}</p>}
              </div>
              <p className="mt-0.5 text-[0.8125rem] text-muted">{WHOLESALE_LABEL[h.wholesale_type]} snapback</p>
              {h.description && <p className="mt-2 line-clamp-3 text-[0.8125rem] leading-relaxed text-muted">{h.description}</p>}
              <div className="mt-auto pt-3">
                {!open ? (
                  <p className="border border-rule px-3 py-2.5 text-center font-label text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-muted">Coming soon</p>
                ) : (
                <AddToBag
                  compact
                  line={{
                    productId: h.id,
                    title: h.title,
                    sellerName: seller.name,
                    sellerSlug: seller.slug,
                    sellerId: seller.id,
                    pickup: seller.pickup_enabled,
                    priceCents: h.price_cents!,
                    image: h.image_url,
                  }}
                />
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-14 max-w-2xl border-t border-rule pt-8 text-sm leading-relaxed text-muted">
          {open
            ? `Every hat is embroidered by Townies and shipped by us. Part of every sale goes straight to ${seller.name}.`
            : `Every hat is embroidered by Townies. Online ordering opens soon, and part of every sale will go straight to ${seller.name}.`}
        </p>
      </div>
    </>
  );
}
