import { cn } from '@/lib/utils';

interface PriceProps {
  money: { amount: string; currencyCode: string };
  compareAtMoney?: { amount: string; currencyCode: string } | null;
  className?: string;
}

function formatMoney(money: { amount: string; currencyCode: string }): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(parseFloat(money.amount));
}

export function Price({ money, compareAtMoney, className }: PriceProps) {
  const formatted = formatMoney(money);
  const compareFormatted = compareAtMoney ? formatMoney(compareAtMoney) : null;

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="font-medium">{formatted}</span>
      {compareFormatted && (
        <span className="text-brand-muted line-through text-sm">{compareFormatted}</span>
      )}
    </span>
  );
}
