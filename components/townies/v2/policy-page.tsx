import Link from 'next/link';

/** Shared shell for the Terms pages (shipping, returns): studio masthead, plain sections. */
export function PolicyPage({
  eyebrow,
  title,
  updated,
  sections,
  related,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  sections: Array<{ id: string; heading: string; body: React.ReactNode }>;
  related: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="bg-bg">
      <section className="border-b border-rule bg-[#F1EEE8]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-14">
          <p className="mb-3 font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/60">{eyebrow}</p>
          <h1 className="display text-[2.5rem] text-text sm:text-[3.25rem]">{title}</h1>
          <p className="mt-3 text-[0.875rem] text-text/60">Last updated {updated}</p>
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-8 sm:pb-28">
        <div className="space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className={i ? 'border-t border-rule pt-10' : ''}>
              <h2 className="font-label text-[1.25rem] font-bold text-text">{s.heading}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-muted [&_strong]:font-semibold [&_strong]:text-text">{s.body}</div>
            </section>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-rule pt-6 text-[0.875rem]">
          {related.map((r) => (
            <Link key={r.href} href={r.href} className="text-text underline underline-offset-4 hover:text-text/70">
              {r.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
