'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { btn, field } from '@/components/admin/ui';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push('/admin');
    } else {
      setError('Invalid email or password.');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-town-navy px-4 font-body text-town-cream">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logos/townies-script-natural.svg" alt="Townies" className="h-16 w-auto" />
          <span className="admin-eyebrow">Admin</span>
        </div>
        <div className="rounded-2xl border border-town-cream/10 bg-town-cream/[0.04] p-6 sm:p-8">
          <h1 className="mb-1 font-block text-3xl font-bold leading-none text-town-cream">Sign in</h1>
          <p className="mb-6 text-sm text-town-cream/55">Townies back office</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="admin-eyebrow mb-1.5 block">email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={field}
                placeholder="you@townies.shop"
              />
            </div>
            <div>
              <label className="admin-eyebrow mb-1.5 block">password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={field}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button type="submit" disabled={loading} className={`${btn.primary} w-full py-3`}>
              {loading ? 'signing in…' : 'sign in →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
