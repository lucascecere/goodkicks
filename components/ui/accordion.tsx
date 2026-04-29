interface AccordionItem {
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export function Accordion({ items }: AccordionProps) {
  return (
    <div className="divide-y divide-brand-rule border-y border-brand-rule">
      {items.map((item, i) => (
        <details key={i} className="group">
          <summary className="flex items-center justify-between py-4 cursor-pointer list-none text-brand-ink font-medium hover:text-brand-rust transition-colors">
            <span>{item.question}</span>
            <span className="ml-4 text-brand-muted group-open:rotate-180 transition-transform duration-200 text-lg leading-none">↓</span>
          </summary>
          <div className="pb-4 text-brand-muted leading-relaxed">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
