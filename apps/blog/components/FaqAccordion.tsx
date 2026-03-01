"use client";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  if (items.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-content">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Frequently Asked Questions
      </h2>
      <div className="overflow-hidden rounded-2xl border border-edge/60">
        {items.map((item, i) => (
          <details key={i} className="group border-b border-edge last:border-b-0">
            <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-left text-[15px] font-medium text-content transition-colors hover:bg-surface-alt/50 hover:text-primary [&::-webkit-details-marker]:hidden">
              {item.question}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <div className="px-5 pb-4 text-sm leading-relaxed text-muted">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
