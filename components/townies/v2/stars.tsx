import { Star } from 'lucide-react';

/** Read-only star row. Partial stars round to the nearest half visually via fill width. */
export function Stars({ value, size = 14, className = '' }: { value: number; size?: number; className?: string }) {
  return (
    <span className={`relative inline-flex ${className}`} aria-label={`${value.toFixed(1)} out of 5 stars`} role="img">
      <span className="flex text-rule">
        {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={size} className="fill-current" aria-hidden />)}
      </span>
      <span className="absolute inset-0 flex overflow-hidden text-text" style={{ width: `${(Math.max(0, Math.min(5, value)) / 5) * 100}%` }}>
        {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={size} className="shrink-0 fill-current" aria-hidden />)}
      </span>
    </span>
  );
}
