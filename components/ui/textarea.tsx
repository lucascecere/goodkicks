import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded border border-brand-rule bg-white px-4 py-3 text-brand-ink placeholder:text-brand-muted resize-y min-h-[120px]',
        'focus:outline-none focus:border-brand-rust focus:ring-1 focus:ring-brand-rust',
        'transition-colors duration-150',
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';
