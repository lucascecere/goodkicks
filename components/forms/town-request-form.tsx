'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Field, SubmitButton, Submitted, fieldClass, postContact } from './form-kit';

type Values = { name: string; email: string; town: string; message?: string };

/** Request a town. Deliberately the shortest form on the site. */
export function TownRequestForm() {
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>();

  if (done) {
    return (
      <Submitted
        title="Town noted."
        body="Every request gets counted. The towns that shout loudest get made first — tell your group chat."
      />
    );
  }

  return (
    <form
      className="space-y-5 max-w-xl"
      onSubmit={handleSubmit(async (d) => {
        if (await postContact({ type: 'town_request', ...d })) setDone(true);
      })}
    >
      <Field label="Your town" error={errors.town?.message}>
        <input className={fieldClass} placeholder="Braintree" {...register('town', { required: 'Town is required' })} />
      </Field>
      <Field label="Name" error={errors.name?.message}>
        <input className={fieldClass} placeholder="Your name" {...register('name', { required: 'Name is required' })} />
      </Field>
      <Field label="Email" error={errors.email?.message} hint="So we can tell you the day it drops.">
        <input type="email" className={fieldClass} placeholder="you@email.com"
          {...register('email', { required: 'Email is required' })} />
      </Field>
      <Field label="Anything we should know?" hint="Optional. Nickname, year founded, what the hat has to say.">
        <textarea rows={4} className={fieldClass} placeholder="02184 forever." {...register('message')} />
      </Field>
      <SubmitButton submitting={isSubmitting} label="Request town" />
    </form>
  );
}
