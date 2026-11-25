'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Field, SubmitButton, fieldClass, HONEYPOT_NAME } from './form-kit';
import { formToken } from '@/lib/form-token-client';
import { track } from '@/lib/track';
import { GIVEAWAY, OTHER_TOWN } from '@/lib/townies/giveaway';

export type GiveawayTown = { slug: string; name: string; image: string | null };

type Values = { town: string; otherTown?: string; name: string; email: string; igHandle?: string };

function sized(url: string, w: number) {
  return url + (url.includes('?') ? '&' : '?') + `width=${w}`;
}

/** Town hat giveaway entry: tap your hat, name, email. Posts to /api/giveaway. */
export function GiveawayForm({ towns }: { towns: GiveawayTown[] }) {
  const params = useSearchParams();
  const prefill = params.get('town') ?? '';
  const utm = params.get('utm_source') ?? params.get('ref') ?? '';
  const [done, setDone] = useState<{ town: string; already: boolean } | null>(null);
  const [err, setErr] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Values>({
    defaultValues: { town: towns.some((t) => t.slug === prefill) ? prefill : '' },
  });
  const picked = watch('town');

  if (done) {
    const name = done.town;
    return (
      <div className="py-10 space-y-4">
        <p className="font-heading uppercase text-3xl sm:text-4xl text-text">
          {done.already ? `You’re already in for ${name}.` : `You’re in for the ${name} hat.`}
        </p>
        <p className="text-muted max-w-xl">
          We pick one winner per town on {GIVEAWAY.pickLabel} and email them that day.
          Want a second entry? Follow{' '}
          <a href="https://instagram.com/townies.shop" className="underline underline-offset-4 hover:text-text">@townies.shop</a>{' '}
          and comment your town on the giveaway post. Know someone from another town? Send them this page.
        </p>
        <button
          type="button"
          onClick={() => { setDone(null); }}
          className="text-sm underline underline-offset-4 text-muted hover:text-text"
        >
          Enter for another town
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-8"
      onSubmit={handleSubmit(async (d) => {
        setErr('');
        try {
          const _t = await formToken();
          const res = await fetch('/api/giveaway', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...d,
              utm,
              _hp: (document.querySelector(`input[name="${HONEYPOT_NAME}"]`) as HTMLInputElement | null)?.value ?? '',
              _ms: Math.round(performance.now()),
              _t,
            }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok || !json.ok) {
            setErr(json.error ?? 'Something went wrong. Try again.');
            return;
          }
          const townName = d.town === OTHER_TOWN ? (d.otherTown ?? 'your town') : (towns.find((t) => t.slug === d.town)?.name ?? d.town);
          track('giveaway_entry', { town: d.town });
          setDone({ town: townName, already: Boolean(json.already) });
        } catch {
          setErr('Something went wrong. Try again.');
        }
      })}
    >
      <fieldset>
        <legend className="block text-xs uppercase tracking-[0.15em] text-muted mb-3">Pick your town</legend>
        <div className="grid grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5">
          {towns.map((t) => {
            const on = picked === t.slug;
            return (
              <label
                key={t.slug}
                className={`relative cursor-pointer rounded-sm border bg-white transition-colors ${on ? 'border-text ring-2 ring-text' : 'border-rule hover:border-text/50'}`}
              >
                <input type="radio" value={t.slug} className="sr-only" {...register('town', { required: 'Pick your town' })} />
                {t.image ? (
                  <img src={sized(t.image, 400)} alt="" className="w-full aspect-[4/3] object-cover" loading="lazy" />
                ) : (
                  <div className="w-full aspect-[4/3]" />
                )}
                <span className="block text-center text-[10px] sm:text-xs font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-text pb-2 sm:pb-2.5 -mt-1 px-1 leading-tight">{t.name}</span>
                {on ? (
                  <span className="absolute top-2 right-2 rounded-full bg-text text-bg text-[10px] font-bold px-2 py-0.5">✓</span>
                ) : null}
              </label>
            );
          })}
          <label
            className={`cursor-pointer rounded-sm border flex items-center justify-center text-center p-4 transition-colors ${picked === OTHER_TOWN ? 'border-text ring-2 ring-text bg-white' : 'border-rule border-dashed hover:border-text/50'}`}
          >
            <input type="radio" value={OTHER_TOWN} className="sr-only" {...register('town', { required: 'Pick your town' })} />
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">My town isn’t here</span>
          </label>
        </div>
        {errors.town ? <p className="text-red-600 text-xs mt-2">{errors.town.message}</p> : null}
        {picked === OTHER_TOWN ? (
          <div className="mt-4 max-w-md">
            <Field label="Your town" hint="We keep a list. The most-requested towns get made next." error={errors.otherTown?.message}>
              <input className={fieldClass} placeholder="Hingham" {...register('otherTown', { required: 'Type your town' })} />
            </Field>
          </div>
        ) : null}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2 max-w-2xl">
        <Field label="Name" error={errors.name?.message}>
          <input className={fieldClass} placeholder="Your name" autoComplete="name" {...register('name', { required: 'Name is required' })} />
        </Field>
        <Field label="Email" error={errors.email?.message} hint="How we tell you if you win.">
          <input type="email" className={fieldClass} placeholder="you@email.com" autoComplete="email"
            {...register('email', { required: 'Email is required' })} />
        </Field>
        <Field label="Instagram (optional)" hint="So we can tag you if you win.">
          <input className={fieldClass} placeholder="@yourhandle" {...register('igHandle')} />
        </Field>
      </div>

      {err ? <p className="text-red-600 text-sm">{err}</p> : null}
      <SubmitButton submitting={isSubmitting} label="Enter the giveaway" />
    </form>
  );
}
