'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { btn } from './ui';

type Result = { ok: true; message?: string } | { ok: false; error: string };

function Note({ result }: { result: Result | null }) {
  if (!result) return null;
  if (result.ok && !result.message) return null;
  return (
    <p className={`text-xs ${result.ok ? 'text-emerald-300' : 'text-red-300'}`} role="status">
      {result.ok ? result.message : result.error}
    </p>
  );
}

/** A button that runs a server action and shows what happened under it. */
export function ActionButton({
  action,
  children,
  look = 'secondary',
  confirm,
  openResult,
  className = '',
}: {
  action: () => Promise<Result>;
  children: ReactNode;
  look?: keyof typeof btn;
  confirm?: string;
  /** Treat the success message as a URL and open it (e.g. a Stripe login link). */
  openResult?: boolean;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const router = useRouter();
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        disabled={pending}
        className={`${btn[look]} ${className}`}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => {
            const r = await action();
            if (openResult && r.ok && r.message) {
              window.open(r.message, '_blank', 'noopener');
              setResult({ ok: true });
            } else setResult(r);
            router.refresh();
          });
        }}
      >
        {pending ? 'Working…' : children}
      </button>
      <Note result={result} />
    </div>
  );
}

/** A form that posts its fields to a server action and shows the result. */
export function ActionForm({
  action,
  children,
  className = '',
  resetOnSuccess = false,
}: {
  action: (fd: FormData) => Promise<Result>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const router = useRouter();
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          const r = await action(fd);
          setResult(r);
          if (r.ok) {
            if (resetOnSuccess) form.reset();
            router.refresh();
          }
        });
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      <div className="mt-2">
        <Note result={result} />
      </div>
    </form>
  );
}
