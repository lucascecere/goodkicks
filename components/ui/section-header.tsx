import Link from 'next/link';

/**
 * The one place the section type ramp is written down.
 *
 * Every section header on the site used to re-type its own eyebrow and H2,
 * which is how the page ended up with headlines at 60px, 72px and 96px that
 * were all meant to be the same level. Emitting them from here means shrinking
 * the ramp is one edit, not a search across a dozen files.
 *
 * Takes explicit props with NO className passthrough on purpose: `cn` in
 * lib/utils is a naive join rather than tailwind-merge, so a passed `text-4xl`
 * would emit alongside the ramp class and leave stylesheet order to pick the
 * winner. Same reasoning as the `fit` prop on BrandImage.
 */
export function SectionHeader({
  eyebrow,
  title,
  link,
}: {
  eyebrow?: string;
  title: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
      <div>
        {eyebrow && (
          <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-town-forest mb-2">
            {eyebrow}
          </p>
        )}
        <h2 className="font-block font-bold uppercase text-2xl sm:text-3xl leading-none tracking-[0.015em] text-town-navy">
          {title}
        </h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className="hidden sm:inline-block shrink-0 text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-town-navy hover:text-town-forest transition-colors"
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}
