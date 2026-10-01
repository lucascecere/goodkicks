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
      <h2 className="display text-text text-xl sm:text-2xl mb-4">{heading}</h2>
      <ul className={`flex flex-wrap gap-2 ${align === 'center' ? 'justify-center' : ''}`}>
        {towns.map((t) => (
          <li key={t.slug}>
            <Link
              href={townHref(t.slug)}
              className="inline-flex items-center rounded-full border border-text/20 bg-surface px-4 py-2 text-sm font-semibold text-text hover:border-accent hover:bg-accent hover:text-accent-contrast transition-colors"
            >
              {t.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
