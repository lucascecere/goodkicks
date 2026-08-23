'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Field, SubmitButton, Submitted, fieldClass, postContact } from './form-kit';

type Values = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  website?: string;
  businessType?: string;
  location?: string;
  quantity?: string;
  timeline?: string;
  towns?: string;
  message: string;
};

// Bulk-first ordering. A team, a company or a fundraiser buying one run of hats
// is the common case; a shop that wants to stock and resell is the specialist
// one, so it sits at the bottom rather than the top.
const BUSINESS_TYPES = [
  'Team or league',
  'School or booster club',
  'Company or staff gift',
  'Event or fundraiser',
  'Family, wedding or reunion',
  'Retail shop — I want to stock Townies',
  'Other',
];

const QUANTITIES = ['Under 25', '25 – 50', '50 – 100', '100 – 250', '250+', 'Not sure yet'];
const TIMELINES = ['As soon as possible', 'Within a month', '1 – 3 months', 'Just exploring'];

/**
 * Bulk and wholesale enquiries, one form.
 *
 * The long one, on purpose: an enquiry that arrives as "interested in bulk"
 * costs two or three emails before it can be quoted. Asking for volume,
 * timeline and which hats up front means the first reply can be a real answer.
 *
 * ONLY name, email and message are required. `company` used to be required too,
 * which quietly blocked the single most common bulk buyer there is — a coach
 * ordering thirty hats for a team, who has no company to put in the box.
 */
export function WholesaleForm() {
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>();

  if (done) {
    return (
      <Submitted
        title="Thanks — we'll be in touch."
        body="Bulk enquiries get a real reply within two business days, with a price for the quantity you asked about and a realistic lead time. Everything after that runs over email — there's nothing else to fill in."
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
        <Field label="What's this for?">
          <select className={fieldClass} defaultValue="" {...register('businessType')}>
            <option value="" disabled>Choose one</option>
            {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Team, company or shop" hint="Optional — skip it if it's just you.">
          <input className={fieldClass} placeholder="Milton Youth Hockey" {...register('company')} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Phone" hint="Optional.">
          <input className={fieldClass} placeholder="(617) 555-0134" {...register('phone')} />
        </Field>
        <Field label="Town / city">
          <input className={fieldClass} placeholder="Where you're based" {...register('location')} />
        </Field>
      </div>

      <Field label="Website or Instagram" hint="Optional — helps us picture who we're making for.">
        <input className={fieldClass} placeholder="instagram.com/yourteam" {...register('website')} />
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

      <Field label="Which hats?" hint="Towns, styles, or both — and tell us if you want something we don't make yet.">
        <input className={fieldClass} placeholder="Milton 'Classic', Weymouth, or a custom town" {...register('towns')} />
      </Field>

      <Field label="Anything else we should know?" error={errors.message?.message}>
        <textarea rows={5} className={fieldClass}
          placeholder="Who they're for, whether you need custom embroidery, a date you're working to — anything that helps us quote it properly first time."
          {...register('message', { required: 'A short note is required', minLength: { value: 10, message: 'A bit more detail, please.' } })} />
      </Field>

      <SubmitButton submitting={isSubmitting} label="Send enquiry" />
    </form>
  );
}
