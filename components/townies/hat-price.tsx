import { blackFridayOn, bfHatPriceCents, isHat, usd } from '@/lib/townies/black-friday';

/**
 * A hat's price, with the Black Friday sale price when it is running
 * ($19.99 next to a struck-through $29.99). Everything else renders the plain
 * price exactly as before.
 */
export function HatPrice({
  title,
  amount,
  className = '',
  saleClassName = 'text-[#B3261E] font-semibold',
}: {
  title: string;
  /** Shopify price amount, e.g. "29.99". */
  amount: string | number | null | undefined;
  className?: string;
  saleClassName?: string;
}) {
  const n = typeof amount === 'number' ? amount : parseFloat(amount ?? '');
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  if (!blackFridayOn() || !isHat(title)) return <span className={className}>{usd(cents)}</span>;
  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span className={saleClassName}>{usd(bfHatPriceCents(cents))}</span>
      <s className="text-[0.85em] opacity-55">{usd(cents)}</s>
    </span>
  );
}
