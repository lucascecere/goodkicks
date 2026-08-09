'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Field, SubmitButton, Submitted, fieldClass, postContact } from './form-kit';

type Values = {
  name: string;
  email: string;
  company: string;
  phone?: string;
  website?: string;
  businessType?: string;
  location?: string;
  quantity?: string;
  timeline?: string;
  towns?: string;
  message: string;
};

const BUSINESS_TYPES = [
  'Retail shop',
  'Boutique',
  'Team / league',
  'School or booster club',
  'Corporate / company store',
  'Event or fundraiser',
  'Other',
];

const QUANTITIES = ['Under 25', '25 – 50', '50 – 100', '100 – 250', '250+', 'Not sure yet'];
const TIMELINES = ['As soon as possible', 'Within a month', '1 – 3 months', 'Just exploring'];

/**
 * The long one, on purpose.
 *
 * A stockist enquiry that arrives as "interested in wholesale" costs two or
 * three emails before it can even be quoted. Asking for volume, timeline and
 * location up front means the first reply can be a real answer. Everything past
 * the three required fields is optional so a keen buyer is never blocked.
 */
export function WholesaleForm() {
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>();

  if (done) {
    return (
      <Submitted
        title="Thanks — we'll be in touch."
        body="Wholesale enquiries get a real reply within two business days, with pricing tiers and lead times."
      />
    );
  }

  return (
    <form
      className="space-y-6 max-w-2xl"
      onSubmit={handleSubmit(async (d) => {
        if (await postContact({ type: 'wholesale', ...d })) setDone(true);
      })}
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Your name" error={errors.name?.message}>
          <input className={fieldClass} placeholder="Your name" {...register('name', { required: 'Name is required' })} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" className={fieldClass} placeholder="you@shop.com"
            {...register('email', { required: 'Email is required' })} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Shop / company" error={errors.company?.message}>
          <input className={fieldClass} placeholder="Name of the business"
            {...register('company', { required: 'Company is required' })} />
        </Field>
        <Field label="Phone" hint="Optional.">
          <input className={fieldClass} placeholder="(617) 555-0134" {...register('phone')} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Business type">
          <select className={fieldClass} defaultValue="" {...register('businessType')}>
            <option value="" disabled>Choose one</option>
            {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Town / city">
          <input className={fieldClass} placeholder="Where you're based" {...register('location')} />
        </Field>
      </div>

      <Field label="Website or Instagram" hint="Optional — helps us picture the shop.">
        <input className={fieldClass} placeholder="instagram.com/yourshop" {...register('website')} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Estimated first order">
          <select className={fieldClass} defaultValue="" {...register('quantity')}>
            <option value="" disabled>Choose one</option>
            {QUANTITIES.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </Field>
        <Field label="Timeline">
          <select className={fieldClass} defaultValue="" {...register('timeline')}>
            <option value="" disabled>Choose one</option>
            {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Which towns?" hint="Optional. The towns your customers actually claim.">
        <input className={fieldClass} placeholder="Milton, Weymouth, Braintree" {...register('towns')} />
      </Field>

      <Field label="Tell us about the shop" error={errors.message?.message}>
        <textarea rows={5} className={fieldClass}
          placeholder="Who you sell to, what else you carry, anything else worth knowing."
          {...register('message', { required: 'A short intro is required', minLength: { value: 10, message: 'A bit more detail, please.' } })} />
      </Field>

      <SubmitButton submitting={isSubmitting} label="Send wholesale enquiry" />
    </form>
  );
}
