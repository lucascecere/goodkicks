'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Field, SubmitButton, Submitted, fieldClass, postContact } from './form-kit';

type Values = { name: string; email: string; orderNumber?: string; message: string };

/** General support: order problems, sizing, returns, anything else. */
export function SupportForm() {
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>();

  if (done) {
    return (
      <Submitted
        title="Got it."
        body="We read everything and answer fast — usually same day, always within one business day."
      />
    );
  }

  return (
    <form
      className="space-y-5 max-w-xl"
      onSubmit={handleSubmit(async (d) => {
        // Order number rides along in the message: it has no column of its own
        // and it is the first thing we need for an order problem.
        const message = d.orderNumber ? `Order #${d.orderNumber}\n\n${d.message}` : d.message;
        if (await postContact({ type: 'general', name: d.name, email: d.email, message })) setDone(true);
      })}
    >
      <Field label="Name" error={errors.name?.message}>
        <input className={fieldClass} placeholder="Your name" {...register('name', { required: 'Name is required' })} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <input type="email" className={fieldClass} placeholder="you@email.com"
          {...register('email', { required: 'Email is required' })} />
      </Field>
      <Field label="Order number" hint="Optional — only if this is about an order.">
        <input className={fieldClass} placeholder="#1234" {...register('orderNumber')} />
      </Field>
      <Field label="How can we help?" error={errors.message?.message}>
        <textarea rows={6} className={fieldClass} placeholder="Tell us what's going on."
          {...register('message', { required: 'Message is required', minLength: { value: 10, message: 'A bit more detail, please.' } })} />
      </Field>
      <SubmitButton submitting={isSubmitting} label="Send" />
    </form>
  );
}
