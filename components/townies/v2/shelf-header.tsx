import Link from 'next/link';

/** Melin's section head: a plain bold title left, a small outlined "Shop all" right. */
export function ShelfHeader({
  title,
  sub,
  link,
}: {
  title: string;
  sub?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 sm:mb-8 flex items-end justify-between gap-6">
      <div>
        <h2 className="font-label text-[1.375rem] sm:text-[1.625rem] font-bold tracking-[-0.01em] text-text">{title}</h2>
        {sub && <p className="mt-1 text-[0.9375rem] text-muted">{sub}</p>}
      </div>
      {link && (
        <Link
          href={link.href}
          className="shrink-0 border border-text px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-text transition-colors hover:bg-text hover:text-white font-label"
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}
