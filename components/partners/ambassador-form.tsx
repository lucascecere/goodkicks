'use client';

import { useState } from 'react';
import type { RealBrand } from '@/lib/admin/brand';
import { accountTypesFor } from '@/lib/reps/labels';

type FormState = 'idle' | 'loading' | 'success' | 'error';

// The Townies catalog, for "which hat do you want". Kept as a static list
// rather than a live Shopify read so the form never blocks on the API — update
// it when the collection grows.
const TOWN_HATS = [
  'Milton',
  'Braintree',
  'Weymouth',
  'Hingham',
  'Roslindale',
  'West Roxbury',
  'Norton',
];

const GK_COLORWAYS = [
  { value: 'georgia', label: 'georgia (rust + cream + dark brown)' },
  { value: 'nevada', label: 'nevada (sage + mustard + cream)' },
  { value: 'colorado', label: 'colorado (cream + rust + sage)' },
  { value: 'new-york', label: 'new york (burgundy + mustard + black)' },
  { value: 'massachusetts', label: 'massachusetts' },
  { value: 'maine', label: 'maine (mustard + navy + black)' },
  { value: 'no-preference', label: 'no preference / surprise me' },
];

export function AmbassadorForm({ brand = 'townies' }: { brand?: RealBrand }) {
  const isTownies = brand === 'townies';
  const [state, setState] = useState<FormState>('idle');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    instagram: '',
    school: '',
    town: '',
    hatPreference: '',
    accountType: '',
    followers: '',
    message: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    colorwayPreference: '',
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    const { addressLine1, addressLine2, city, state: st, zip, country, age, firstName, lastName, ...rest } = form;
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    const parts = [addressLine1, addressLine2, city, st, zip, country].filter(Boolean);
    const shippingAddress = parts.length > 1 ? parts.join(', ') : null;
    const parsedAge = age ? parseInt(age, 10) : null;
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rest, brand, name, age: parsedAge, shippingAddress }),
      });
      setState(res.ok ? 'success' : 'error');
    } catch {
      setState('error');
    }
  }

  // Townies uses the semantic/town tokens; Good Kicks keeps its original palette.
  const inputClass = isTownies
    ? 'w-full border border-town-rule rounded-sm px-4 py-3 text-town-navy placeholder:text-town-muted/50 focus:outline-none focus:ring-2 focus:ring-town-forest/40 bg-white text-sm'
    : 'w-full border border-brand-rule rounded-lg px-4 py-3 text-brand-ink placeholder:text-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-rust/40 bg-white text-sm';
  const labelClass = isTownies
    ? 'block text-sm font-medium text-town-navy mb-1.5'
    : 'block text-sm font-medium text-brand-ink mb-1.5';
  const buttonClass = isTownies
    ? 'w-full bg-town-forest text-white py-4 rounded-sm font-semibold uppercase tracking-[0.1em] text-sm hover:bg-town-forest/90 transition-colors disabled:opacity-60'
    : 'w-full bg-brand-rust text-white py-4 rounded-lg font-medium text-lg hover:bg-brand-rust/90 transition-colors disabled:opacity-60';
  const mutedClass = isTownies ? 'text-town-muted' : 'text-brand-muted';

  if (state === 'success') {
    return isTownies ? (
      <div className="text-center space-y-4 py-12">
        <h3 className="font-block uppercase text-3xl text-town-navy">Application in.</h3>
        <p className="text-town-muted">
          we read every one of these ourselves. give us a few days and we&apos;ll come back to you
          either way.
        </p>
      </div>
    ) : (
      <div className="text-center space-y-4 py-12">
        <div className="text-5xl">✌️</div>
        <h3 className="font-display text-3xl text-brand-ink">application received.</h3>
        <p className="text-brand-muted">we&apos;ll review your account and get back to you within a few days. keep the circle going.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>first name</label>
          <input required type="text" placeholder="Alex" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>last name</label>
          <input required type="text" placeholder="Smith" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>email</label>
          <input required type="email" placeholder={isTownies ? 'you@email.com' : 'you@school.edu'} value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>age</label>
          <input required type="number" min="13" max="100" placeholder="18" value={form.age} onChange={(e) => set('age', e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>instagram profile url</label>
        <input
          required
          type="url"
          placeholder={isTownies ? 'https://www.instagram.com/yourhandle' : 'https://www.instagram.com/ohiostatehackysack'}
          value={form.instagram}
          onChange={(e) => set('instagram', e.target.value)}
          className={inputClass}
        />
      </div>

      {isTownies ? (
        <div>
          <label className={labelClass}>
            what town do you rep? <span className={`${mutedClass} font-normal`}>(this becomes your code)</span>
          </label>
          <input required type="text" placeholder="Milton" value={form.town} onChange={(e) => set('town', e.target.value)} className={inputClass} />
        </div>
      ) : (
        <div>
          <label className={labelClass}>school / university</label>
          <input required type="text" placeholder="Ohio State University" value={form.school} onChange={(e) => set('school', e.target.value)} className={inputClass} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>account type</label>
          <select required value={form.accountType} onChange={(e) => set('accountType', e.target.value)} className={inputClass}>
            <option value="">select one</option>
            {accountTypesFor(brand).map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>follower count (approx)</label>
          {/* 3,000 is a BOUNDARY, not a number inside a bucket. The old ranges
              were under-500 / 500–2k / 2k–10k / 10k+, so the bar sat in the
              middle of the third option and an application could not tell you
              whether the applicant cleared it. */}
          <select required value={form.followers} onChange={(e) => set('followers', e.target.value)} className={inputClass}>
            <option value="">select range</option>
            <option value="under-1k">under 1,000</option>
            <option value="1k-3k">1,000 – 3,000</option>
            <option value="3k-10k">3,000 – 10,000</option>
            <option value="10k+">10,000+</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>
          {isTownies ? 'tell us how you rep your town' : 'tell us about your account'}
        </label>
        <textarea
          required
          rows={4}
          placeholder={
            isTownies
              ? 'what town, what you post, who follows you, why people know you as being from there...'
              : 'what school, how active is your circle, what kind of content do you post...'
          }
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          className={inputClass}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div className="space-y-3">
        <label className={labelClass}>
          shipping address{' '}
          <span className={`${mutedClass} font-normal`}>
            {isTownies ? '(where we send your free hat)' : '(optional — where we send your free sack)'}
          </span>
        </label>
        <input type="text" placeholder="street address" value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} className={inputClass} />
        <input type="text" placeholder="apt, suite, unit (optional)" value={form.addressLine2} onChange={(e) => set('addressLine2', e.target.value)} className={inputClass} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <input type="text" placeholder="city" value={form.city} onChange={(e) => set('city', e.target.value)} className={`${inputClass} col-span-2 sm:col-span-1`} />
          <input type="text" placeholder="state" value={form.state} onChange={(e) => set('state', e.target.value)} className={inputClass} />
          <input type="text" placeholder="zip" value={form.zip} onChange={(e) => set('zip', e.target.value)} className={inputClass} />
        </div>
        <select value={form.country} onChange={(e) => set('country', e.target.value)} className={inputClass}>
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
          <option value="other">Other</option>
        </select>
      </div>

      {isTownies ? (
        <div>
          <label className={labelClass}>which hat do you want?</label>
          <select required value={form.hatPreference} onChange={(e) => set('hatPreference', e.target.value)} className={inputClass}>
            <option value="" disabled>select one</option>
            {TOWN_HATS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
            <option value="not-listed">my town isn&apos;t listed yet</option>
          </select>
          <p className={`${mutedClass} text-xs mt-1.5`}>
            don&apos;t see your town? pick &ldquo;not listed&rdquo; — we make new ones all the time.
          </p>
        </div>
      ) : (
        <div>
          <label className={labelClass}>which colorway do you want?</label>
          <select required value={form.colorwayPreference} onChange={(e) => set('colorwayPreference', e.target.value)} className={inputClass}>
            <option value="" disabled>select one</option>
            {GK_COLORWAYS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {state === 'error' && (
        <p className="text-red-500 text-sm">
          something went wrong — try again or email us at{' '}
          {isTownies ? 'hello@townies.shop' : 'info@goodkicks.co'}
        </p>
      )}

      <button type="submit" disabled={state === 'loading'} className={buttonClass}>
        {state === 'loading' ? 'submitting…' : isTownies ? 'submit application →' : 'submit application →'}
      </button>

      <p className={`text-center ${mutedClass} text-xs`}>
        we review every application personally. we&apos;ll reach out via email.
      </p>
    </form>
  );
}
