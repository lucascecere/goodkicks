import Link from 'next/link';
import type { BrandConfig } from '@/lib/brand/brands';
import { TWO_TOWN_DEAL } from '@/lib/townies/two-town-deal';
import { christmasOrderBy } from '@/lib/townies/preorder';
import { track } from '@/lib/track';

type AnnounceItem = { text: string; href?: string; event?: string };

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
  const deal = dealItems(brand);
  const items: AnnounceItem[] = [...deal, ...(brand.announce ?? [])];
  if (items.length === 0) return null;
  // With the deal lines up front the strip is longer than one line can hold:
  // phones get the deal, large screens add the cutoff, extra-large the free
  // shipping line, and the rest wait until the deal ends.
  const show = (i: number) =>
    deal.length === 0
      ? i === 0 ? 'flex' : 'hidden sm:flex'
      : i === 0 ? 'flex' : i === 1 ? 'hidden lg:flex' : i === 2 ? 'hidden xl:flex' : 'hidden';

  return (
    <div className="bg-announce text-announce-contrast">
      <div className="max-w-7xl mx-auto flex h-8 items-center justify-center gap-5 px-4 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] sm:tracking-[0.2em]">
        {items.map((item, i) => (
          <span
            key={item.text}
            className={`items-center gap-5 whitespace-nowrap ${show(i)}`}
          >
            {i > 0 && (
              <span aria-hidden className="opacity-40">
                ·
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                onClick={item.event ? () => track(item.event!, { location: 'announcement_bar' }) : undefined}
                className="underline-offset-4 hover:underline"
              >
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

/**
 * The two-town deal leads the Townies bar while it runs (it's the line phones
 * see), followed by the in-stock Christmas cutoff until that date passes. Both
 * read their facts from code: lib/townies/two-town-deal.ts for the deal, and
 * christmasOrderBy() (the same date the hat pages print) for the cutoff.
 */
function dealItems(brand: BrandConfig): AnnounceItem[] {
  if (brand.id !== 'townies' || !TWO_TOWN_DEAL.enabled) return [];
  const out: AnnounceItem[] = [
    { text: 'Two towns, $50. Any 2 hats are $25 each.', href: brand.shopPath, event: 'two_town_banner_click' },
  ];
  const by = christmasOrderBy(false, []);
  if (by) {
    out.push({
      text: `Order in-stock hats by ${by.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })} for Christmas`,
    });
  }
  return out;
}
