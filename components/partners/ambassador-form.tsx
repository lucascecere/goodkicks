'use client';

import { useState } from 'react';

type FormState = 'idle' | 'loading' | 'success' | 'error';

export function AmbassadorForm() {
  const [state, setState] = useState<FormState>('idle');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    instagram: '',
    school: '',
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
        body: JSON.stringify({ ...rest, name, age: parsedAge, shippingAddress }),
      });
      setState(res.ok ? 'success' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="text-center space-y-4 py-12">
        <div className="text-5xl">✌️</div>
        <h3 className="font-display text-3xl text-brand-ink">application received.</h3>
        <p className="text-brand-muted">we&apos;ll review your account and get back to you within a few days. keep the circle going.</p>
      </div>
    );
  }

  const inputClass = 'w-full border border-brand-rule rounded-lg px-4 py-3 text-brand-ink placeholder:text-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-rust/40 bg-white text-sm';
  const labelClass = 'block text-sm font-medium text-brand-ink mb-1.5';

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
          <input required type="email" placeholder="you@school.edu" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>age</label>
          <input required type="number" min="13" max="100" placeholder="18" value={form.age} onChange={(e) => set('age', e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>instagram profile url</label>
        <input required type="url" placeholder="https://www.instagram.com/ohiostatehackysack" value={form.instagram} onChange={(e) => set('instagram', e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>school / university</label>
        <input required type="text" placeholder="Ohio State University" value={form.school} onChange={(e) => set('school', e.target.value)} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>account type</label>
          <select required value={form.accountType} onChange={(e) => set('accountType', e.target.value)} className={inputClass}>
            <option value="">select one</option>
            <option value="high-school">high school</option>
            <option value="college">college / university</option>
            <option value="freestyle">freestyle / tricks</option>
            <option value="general">general sack community</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>follower count (approx)</label>
          <select required value={form.followers} onChange={(e) => set('followers', e.target.value)} className={inputClass}>
            <option value="">select range</option>
            <option value="under-500">under 500</option>
            <option value="500-2k">500 – 2,000</option>
            <option value="2k-10k">2,000 – 10,000</option>
            <option value="10k+">10,000+</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>tell us about your account</label>
        <textarea
          required
          rows={4}
          placeholder="what school, how active is your circle, what kind of content do you post..."
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          className={inputClass}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div className="space-y-3">
        <label className={labelClass}>shipping address <span className="text-brand-muted font-normal">(optional — where we send your free sack)</span></label>
        <input
          type="text"
          placeholder="street address"
          value={form.addressLine1}
          onChange={(e) => set('addressLine1', e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="apt, suite, unit (optional)"
          value={form.addressLine2}
          onChange={(e) => set('addressLine2', e.target.value)}
          className={inputClass}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="city"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            className={`${inputClass} col-span-2 sm:col-span-1`}
          />
          <input
            type="text"
            placeholder="state"
            value={form.state}
            onChange={(e) => set('state', e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="zip"
            value={form.zip}
            onChange={(e) => set('zip', e.target.value)}
            className={inputClass}
          />
        </div>
        <select value={form.country} onChange={(e) => set('country', e.target.value)} className={inputClass}>
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>which colorway do you want?</label>
        <select required value={form.colorwayPreference} onChange={(e) => set('colorwayPreference', e.target.value)} className={inputClass}>
          <option value="" disabled>select one</option>
          <option value="georgia">georgia (rust + cream + dark brown)</option>
          <option value="nevada">nevada (sage + mustard + cream)</option>
          <option value="colorado">colorado (cream + rust + sage)</option>
          <option value="new-york">new york (burgundy + mustard + black)</option>
          <option value="massachusetts">massachusetts</option>
          <option value="maine">maine (mustard + navy + black)</option>
          <option value="no-preference">no preference / surprise me</option>
        </select>
      </div>

      {state === 'error' && (
        <p className="text-red-500 text-sm">something went wrong — try again or email us at info@goodkicks.co</p>
      )}

      <button
        type="submit"
        disabled={state === 'loading'}
        className="w-full bg-brand-rust text-white py-4 rounded-lg font-medium text-lg hover:bg-brand-rust/90 transition-colors disabled:opacity-60"
      >
        {state === 'loading' ? 'submitting…' : 'submit application →'}
      </button>

      <p className="text-center text-brand-muted text-xs">we review every application personally. we&apos;ll reach out via email.</p>
    </form>
  );
}
