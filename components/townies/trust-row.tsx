import Link from 'next/link';
import { Truck, RotateCcw, MapPin } from 'lucide-react';

/**
 * Three reassurances under the buy button — the questions a first-time buyer
 * has at the exact moment they are deciding, answered where they are looking
 * instead of on a policy page two clicks away. Each links to that page anyway.
 */
export function TrustRow({ items, href }: { items: [string, string, string]; href: string }) {
  const marks = [Truck, RotateCcw, MapPin];
  return (
    <Link
      href={href}
      className="mt-5 grid grid-cols-3 gap-2 rounded-sm border border-rule bg-surface px-3 py-3 text-center transition-colors hover:border-accent"
    >
      {items.map((label, i) => {
        const Mark = marks[i];
        return (
          <span key={label} className="flex flex-col items-center gap-1.5">
            <Mark size={16} strokeWidth={1.75} className="text-accent" />
            <span className="text-[0.6875rem] leading-snug text-muted">{label}</span>
          </span>
        );
      })}
    </Link>
  );
}
