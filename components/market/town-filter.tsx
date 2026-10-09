import Link from 'next/link';
import { MARKET_BASE } from '@/lib/shop/paths';
import { townSlug } from '@/lib/shop/market';

// Town chips. A filter, never a gate: "All towns" is the default and every
// stall shows until you narrow it.
export function TownFilter({ towns, active }: { towns: string[]; active: string | null }) {
  const chip = (on: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-2 font-label text-[0.6875rem] font-bold uppercase tracking-[0.14em] transition-colors ${
      on ? 'border-text bg-text text-white' : 'border-rule text-text hover:border-text'
    }`;
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      <Link href={MARKET_BASE} className={chip(!active)} scroll={false}>
        All towns
      </Link>
      {towns.map((t) => (
        <Link key={t} href={`${MARKET_BASE}?town=${townSlug(t)}`} className={chip(active === townSlug(t))} scroll={false}>
          {t}
        </Link>
      ))}
    </div>
  );
}
