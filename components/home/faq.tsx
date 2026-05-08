const faqs = [
  {
    question: "What is a foot bag?",
    answer: "A foot bag is a small sand-filled bag designed to be kept in the air using only your feet and body — no hands. It's the same thing most people call a 'hacky sack.'"
  },
  {
    question: "Is a foot bag the same thing as a hacky sack?",
    answer: "Yes — 'Hacky Sack' is a brand name trademarked by Wham-O. 'Foot bag' is the sport's real name. Legally, only Wham-O can sell a product called Hacky Sack, so independent makers like us call ours foot bags. Same thing, better bag."
  },
  {
    question: "Are Good Kicks foot bags good for beginners?",
    answer: "Absolutely. Our 32-panel design is rounder and more forgiving than flat or loosely-filled bags, making it easier to control your first kicks. It's the same bag serious players use — just accessible from day one."
  },
  {
    question: "How do I play hacky sack?",
    answer: "Form a circle. Keep the bag in the air using only your feet, knees, and body — no hands. If it touches the ground, you start over. No score, no winners — just how long you can keep the circle going."
  },
  {
    question: "How long does a foot bag last?",
    answer: "A quality foot bag from a reputable manufacturer will last 1-2 years with regular play. Cheap bags from discount brands typically fall apart within weeks. Ours are made by the same manufacturer that's been making foot bags for 30+ years."
  },
  {
    question: "Do you offer bulk orders for campus groups or clubs?",
    answer: "Yes. We do sack accounts for college clubs, dormitory programs, and campus organizations. Reach out through our contact page and we'll sort you out."
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

export function FAQ() {
  return (
    <section className="py-20 px-6 sm:px-8 bg-brand-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-3xl sm:text-4xl text-brand-ink mb-12 text-center">
          questions people actually ask.
        </h2>
        <div className="space-y-1">
          {faqs.map((faq) => (
            <details key={faq.question} className="border-b border-brand-rule group">
              <summary className="cursor-pointer py-5 font-medium text-brand-ink flex justify-between items-center list-none">
                {faq.question}
                <span className="text-brand-rust ml-4 text-lg leading-none group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="pb-5 text-brand-muted leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
