import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AtSign, Globe, MapPin, Store } from 'lucide-react';
import { getStall } from '@/lib/shop/market';
import { MARKET_BASE } from '@/lib/shop/paths';
import { dollars, WHOLESALE_LABEL } from '@/lib/shop/money';
import { Awning, awningTone } from '@/components/market/awning';
import { SellerMark } from '@/components/market/seller-mark';
import { AddToBag } from '@/components/market/add-to-bag';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const stall = await getStall(slug);
  if (!stall) return {};
  const { seller } = stall;
  const title = `${seller.name} Hats${seller.town ? `, ${seller.town}` : ''}`;
  const description = seller.blurb ?? `Custom embroidered ${seller.name} hats, made by Townies.`;
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

  return (
    <>
      <section className="border-b border-rule bg-masthead">
        <Awning tone={awningTone(seller.slug)} height={30} />
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-8 sm:pb-14 sm:pt-10">
          <Link href={MARKET_BASE} className="font-label text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-masthead-contrast/60 hover:text-masthead-contrast">
            ← The Local Market
          </Link>
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
            <SellerMark seller={seller} size={88} />
            <div className="min-w-0">
              <h1 className="display text-[2.25rem] leading-none text-masthead-contrast sm:text-[3rem]">{seller.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-masthead-contrast/75">
                {seller.town && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" strokeWidth={1.75} /> {seller.town}
                  </span>
                )}
                {seller.website && (
                  <a href={seller.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline-offset-4 hover:underline">
                    <Globe className="h-4 w-4" strokeWidth={1.75} /> Website
                  </a>
                )}
                {seller.instagram && (
                  <a href={instagramUrl(seller.instagram)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline-offset-4 hover:underline">
                    <AtSign className="h-4 w-4" strokeWidth={1.75} /> Instagram
                  </a>
                )}
                {seller.pickup_enabled && (
                  <span className="flex items-center gap-1">
                    <Store className="h-4 w-4" strokeWidth={1.75} /> Free pickup at the shop
                  </span>
                )}
              </div>
            </div>
          </div>
          {seller.blurb && <p className="mt-6 max-w-2xl leading-relaxed text-masthead-contrast/80">{seller.blurb}</p>}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
        <p className="mb-6 font-label text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-muted">
          On the table · {hats.length} hat{hats.length === 1 ? '' : 's'}
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
                <p className="shrink-0 text-[0.9375rem] text-text">{dollars(h.price_cents!)}</p>
              </div>
              <p className="mt-0.5 text-[0.8125rem] text-muted">{WHOLESALE_LABEL[h.wholesale_type]} snapback</p>
              {h.description && <p className="mt-2 line-clamp-3 text-[0.8125rem] leading-relaxed text-muted">{h.description}</p>}
              <div className="mt-auto pt-3">
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
              </div>
            </div>
          ))}
        </div>

        <p className="mt-14 max-w-2xl border-t border-rule pt-8 text-sm leading-relaxed text-muted">
          Every hat is embroidered by Townies and shipped by us. Part of every sale goes straight to {seller.name}.
        </p>
      </div>
    </>
  );
}
