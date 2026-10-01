import Link from 'next/link';
import { townHref, type TownPage } from '@/lib/townies/towns';

/** A row of town pills, each linking to that town's page. */
export function TownLinks({
  heading,
  towns,
  align = 'left',
}: {
  heading: string;
  towns: TownPage[];
  align?: 'left' | 'center';
}) {
  if (towns.length === 0) return null;
  return (
    <div className="mt-8 first:mt-0">
      <h2 className="heading text-town-navy text-lg sm:text-xl mb-4">{heading}</h2>
      <ul className={`flex flex-wrap gap-2 ${align === 'center' ? 'justify-center' : ''}`}>
        {towns.map((t) => (
          <li key={t.slug}>
            <Link
              href={townHref(t.slug)}
              className="inline-flex items-center rounded-full border border-town-navy/20 bg-white/60 px-4 py-2 text-sm font-semibold text-town-navy hover:border-town-navy hover:bg-white transition-colors"
            >
              {t.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
