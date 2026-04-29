import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded border border-brand-rule bg-white px-4 py-3 text-brand-ink placeholder:text-brand-muted',
        'focus:outline-none focus:border-brand-rust focus:ring-1 focus:ring-brand-rust',
        'transition-colors duration-150',
        className
      )}
      {...props}
    />
  )
);

Input.displayName = 'Input';
