'use client';

import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
  max?: number;
  disabled?: boolean;
}

export function QuantityStepper({ quantity, onDecrement, onIncrement, max, disabled }: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center border border-rule rounded">
      <button
        onClick={onDecrement}
        disabled={disabled || quantity <= 1}
        aria-label="Decrease quantity"
        className={cn(
          'w-10 h-10 flex items-center justify-center text-text hover:bg-rule/50 transition-colors',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset'
        )}
      >
        −
      </button>
      <span className="w-10 text-center text-text font-medium select-none">{quantity}</span>
      <button
        onClick={onIncrement}
        disabled={disabled || (max !== undefined && quantity >= max)}
        aria-label="Increase quantity"
        className={cn(
          'w-10 h-10 flex items-center justify-center text-text hover:bg-rule/50 transition-colors',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset'
        )}
      >
        +
      </button>
    </div>
  );
}
