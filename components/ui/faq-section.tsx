/**
 * Accordion FAQ with FAQPage structured data, in the brand's voice via the
 * semantic tokens. Plain <details>: no client JS, works without hydration,
 * and Google reads the schema regardless of which one is open.
 */
export function FaqSection({
  id = 'faq',
  eyebrow,
  title,
  items,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  items: Array<{ q: string; a: string }>;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <section id={id} className="scroll-mt-24 bg-bg border-t border-rule">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-accent mb-3">
          {eyebrow}
        </p>
        <h2 className="heading text-2xl sm:text-3xl leading-none text-text mb-8">{title}</h2>
        <div className="border-t border-rule">
          {items.map((f) => (
            <details key={f.q} className="group border-b border-rule">
              <summary className="flex items-center justify-between gap-6 py-4 cursor-pointer list-none font-medium text-text hover:text-accent transition-colors [&::-webkit-details-marker]:hidden">
                <span>{f.q}</span>
                <span aria-hidden className="text-accent text-lg leading-none transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
