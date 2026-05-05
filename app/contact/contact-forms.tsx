'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type GeneralFormData = {
  name: string;
  email: string;
  message: string;
};

type PartnershipFormData = {
  name: string;
  email: string;
  groupName: string;
  igHandle: string;
  message: string;
};

function GeneralForm() {
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GeneralFormData>();

  const onSubmit = async (data: GeneralFormData) => {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'general', ...data }),
    });
    if (res.ok) setSuccess(true);
  };

  if (success) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-4xl">🏐</div>
        <p className="font-display text-2xl text-brand-ink">message received.</p>
        <p className="text-brand-muted">we&apos;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="general-name" className="block text-sm text-brand-muted mb-1">name</label>
        <Input id="general-name" {...register('name', { required: 'Name is required' })} />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="general-email" className="block text-sm text-brand-muted mb-1">email</label>
        <Input
          id="general-email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Valid email required' },
          })}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="general-message" className="block text-sm text-brand-muted mb-1">message</label>
        <Textarea
          id="general-message"
          {...register('message', {
            required: 'Message is required',
            minLength: { value: 10, message: 'Message must be at least 10 characters' },
          })}
        />
        {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-brand-rust text-white px-6 py-3 rounded font-medium hover:bg-brand-rust/90 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'sending...' : 'send →'}
      </button>
    </form>
  );
}

function PartnershipForm() {
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PartnershipFormData>();

  const onSubmit = async (data: PartnershipFormData) => {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'partnership', ...data }),
    });
    if (res.ok) setSuccess(true);
  };

  if (success) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-4xl">🏐</div>
        <p className="font-display text-2xl text-brand-ink">we&apos;re excited.</p>
        <p className="text-brand-muted">we&apos;ll be in touch about your crew.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="p-name" className="block text-sm text-brand-muted mb-1">name</label>
        <Input id="p-name" {...register('name', { required: 'Name is required' })} />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="p-email" className="block text-sm text-brand-muted mb-1">email</label>
        <Input
          id="p-email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Valid email required' },
          })}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="p-group" className="block text-sm text-brand-muted mb-1">school or group name</label>
        <Input id="p-group" {...register('groupName', { required: 'Group name is required' })} />
        {errors.groupName && <p className="text-red-500 text-xs mt-1">{errors.groupName.message}</p>}
      </div>
      <div>
        <label htmlFor="p-ig" className="block text-sm text-brand-muted mb-1">instagram handle</label>
        <Input
          id="p-ig"
          placeholder="@yourhandle"
          {...register('igHandle', { required: 'Instagram handle is required' })}
        />
        {errors.igHandle && <p className="text-red-500 text-xs mt-1">{errors.igHandle.message}</p>}
      </div>
      <div>
        <label htmlFor="p-message" className="block text-sm text-brand-muted mb-1">tell us about the crew</label>
        <Textarea
          id="p-message"
          {...register('message', {
            required: 'Message is required',
            minLength: { value: 10, message: 'At least 10 characters' },
          })}
        />
        {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-brand-rust text-white px-6 py-3 rounded font-medium hover:bg-brand-rust/90 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'sending...' : 'get in touch →'}
      </button>
    </form>
  );
}

export function ContactForms() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
      <div>
        <h2 className="font-display text-2xl text-brand-ink mb-2">say hi.</h2>
        <p className="text-brand-muted mb-6">questions, ideas, or just want to send us a sack selfie? we&apos;re listening.</p>
        <GeneralForm />
      </div>
      <div>
        <h2 className="font-display text-2xl text-brand-ink mb-2">run a sack account?</h2>
        <p className="text-brand-muted mb-6">we work directly with school sack accounts and friend-group crews. custom colorways, group pricing, partnership perks — let&apos;s talk.</p>
        <PartnershipForm />
      </div>
    </div>
  );
}
