import Link from 'next/link';
import type { BrandConfig } from '@/lib/brand/brands';

/**
 * The thin promo strip above the header.
 *
 * One still line, centred, the way '47 and No Rivals run theirs. It used to
 * scroll; a moving strip above a navy header and a full-bleed photograph was
 * one moving thing too many at the top of the page. Phones see the first
 * promise only; wider screens see all of them with a middot between.
 *
 * EVERY LINE MUST BE TRUE. This bar is the first claim a visitor reads and the
 * one they will hold us to at checkout, so it carries only facts the store can
 * honour. The free-shipping threshold is read from the SAME brand field that
 * drives the cart's progress bar, so the two can never drift apart. No invented
 * discount codes, no "limited time", no countdown.
 */
export function AnnouncementBar({ brand }: { brand: BrandConfig }) {
  const items = brand.announce;
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-announce text-announce-contrast">
      <div className="max-w-7xl mx-auto flex h-8 items-center justify-center gap-5 px-4 text-[0.625rem] font-semibold uppercase tracking-[0.2em]">
        {items.map((item, i) => (
          <span
            key={item.text}
            className={`items-center gap-5 whitespace-nowrap ${i === 0 ? 'flex' : 'hidden sm:flex'}`}
          >
            {i > 0 && (
              <span aria-hidden className="opacity-40">
                ·
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className="underline-offset-4 hover:underline">
                {item.text}
              </Link>
            ) : (
              item.text
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
