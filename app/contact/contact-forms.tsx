'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';

type Intent = 'general' | 'town_request' | 'wholesale';

const TABS: Array<{ id: Intent; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'town_request', label: 'Request a Town' },
  { id: 'wholesale', label: 'Wholesale' },
];

const fieldClass =
  'w-full bg-white border border-town-rule rounded-sm px-4 py-2.5 text-sm text-town-navy placeholder:text-town-stone focus:outline-none focus:ring-2 focus:ring-town-forest';
const labelClass = 'block text-xs uppercase tracking-[0.15em] text-town-muted mb-1.5';
const errClass = 'text-red-600 text-xs mt-1';

function Submitted({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-center py-12 space-y-3">
      <p className="font-block uppercase text-3xl text-town-navy">{title}</p>
      <p className="text-town-muted">{body}</p>
    </div>
  );
}

function SubmitButton({ submitting, label }: { submitting: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="bg-town-forest text-white px-6 py-3 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-town-forest/90 transition-colors disabled:opacity-50"
    >
      {submitting ? 'Sending…' : label}
    </button>
  );
}

async function post(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, brand: 'townies' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function GeneralForm() {
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<{ name: string; email: string; message: string }>();

  if (done) return <Submitted title="Message received." body="We'll get back to you soon." />;

  return (
    <form
      onSubmit={handleSubmit(async (d) => { if (await post({ type: 'general', ...d })) setDone(true); })}
      className="space-y-4"
    >
      <div>
        <label className={labelClass} htmlFor="g-name">Name</label>
        <input id="g-name" className={fieldClass} {...register('name', { required: 'Name is required' })} />
        {errors.name && <p className={errClass}>{errors.name.message}</p>}
      </div>
      <div>
        <label className={labelClass} htmlFor="g-email">Email</label>
        <input id="g-email" type="email" className={fieldClass}
          {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Valid email required' } })} />
        {errors.email && <p className={errClass}>{errors.email.message}</p>}
      </div>
      <div>
        <label className={labelClass} htmlFor="g-message">Message</label>
        <textarea id="g-message" rows={4} className={fieldClass}
          {...register('message', { required: 'Message is required', minLength: { value: 10, message: 'At least 10 characters' } })} />
        {errors.message && <p className={errClass}>{errors.message.message}</p>}
      </div>
      <SubmitButton submitting={isSubmitting} label="Send" />
    </form>
  );
}

function TownRequestForm() {
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<{ name: string; email: string; town: string; message?: string }>();

  if (done) return <Submitted title="Town noted." body="Enough requests and it joins the lineup." />;

  return (
    <form
      onSubmit={handleSubmit(async (d) => { if (await post({ type: 'town_request', ...d })) setDone(true); })}
      className="space-y-4"
    >
      <div>
        <label className={labelClass} htmlFor="t-town">Your town</label>
        <input id="t-town" placeholder="e.g. Scituate, MA" className={fieldClass}
          {...register('town', { required: 'Town is required' })} />
        {errors.town && <p className={errClass}>{errors.town.message}</p>}
      </div>
      <div>
        <label className={labelClass} htmlFor="t-name">Name</label>
        <input id="t-name" className={fieldClass} {...register('name', { required: 'Name is required' })} />
        {errors.name && <p className={errClass}>{errors.name.message}</p>}
      </div>
      <div>
        <label className={labelClass} htmlFor="t-email">Email</label>
        <input id="t-email" type="email" className={fieldClass}
          {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Valid email required' } })} />
        {errors.email && <p className={errClass}>{errors.email.message}</p>}
      </div>
      <div>
        <label className={labelClass} htmlFor="t-message">Anything else? (optional)</label>
        <textarea id="t-message" rows={3} className={fieldClass} {...register('message')} />
      </div>
      <SubmitButton submitting={isSubmitting} label="Request town" />
    </form>
  );
}

function WholesaleForm() {
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<{ name: string; email: string; company: string; message: string }>();

  if (done) return <Submitted title="Thanks." body="We'll be in touch about wholesale." />;

  return (
    <form
      onSubmit={handleSubmit(async (d) => { if (await post({ type: 'wholesale', ...d })) setDone(true); })}
      className="space-y-4"
    >
      <div>
        <label className={labelClass} htmlFor="w-company">Shop / company name</label>
        <input id="w-company" className={fieldClass} {...register('company', { required: 'Company is required' })} />
        {errors.company && <p className={errClass}>{errors.company.message}</p>}
      </div>
      <div>
        <label className={labelClass} htmlFor="w-name">Contact name</label>
        <input id="w-name" className={fieldClass} {...register('name', { required: 'Name is required' })} />
        {errors.name && <p className={errClass}>{errors.name.message}</p>}
      </div>
      <div>
        <label className={labelClass} htmlFor="w-email">Email</label>
        <input id="w-email" type="email" className={fieldClass}
          {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Valid email required' } })} />
        {errors.email && <p className={errClass}>{errors.email.message}</p>}
      </div>
      <div>
        <label className={labelClass} htmlFor="w-message">Tell us about your shop</label>
        <textarea id="w-message" rows={4} className={fieldClass}
          {...register('message', { required: 'Message is required', minLength: { value: 10, message: 'At least 10 characters' } })} />
        {errors.message && <p className={errClass}>{errors.message.message}</p>}
      </div>
      <SubmitButton submitting={isSubmitting} label="Get in touch" />
    </form>
  );
}

export function ContactForms() {
  const [intent, setIntent] = useState<Intent>('general');

  return (
    <div className="max-w-lg">
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setIntent(t.id)}
            className={cn(
              'px-4 py-2 rounded-sm border text-xs uppercase tracking-[0.12em] transition-colors',
              intent === t.id
                ? 'border-town-navy bg-town-navy text-white'
                : 'border-town-rule text-town-muted hover:border-town-navy',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {intent === 'general' && <GeneralForm />}
      {intent === 'town_request' && <TownRequestForm />}
      {intent === 'wholesale' && <WholesaleForm />}
    </div>
  );
}
