'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
    <div className="min-h-screen bg-brand-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/brand/logo.png" alt="Good Kicks" width={72} height={72} style={{ height: '72px', width: 'auto' }} />
        </div>
        <div className="bg-brand-cream rounded-2xl p-8 shadow-xl">
          <h1 className="font-display text-2xl text-brand-ink mb-1">admin login</h1>
          <p className="text-brand-muted text-sm mb-6">good kicks internal dashboard</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-brand-ink mb-1.5 uppercase tracking-wide">email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-brand-rule rounded-lg px-4 py-3 text-brand-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-rust/40 bg-white"
                placeholder="you@goodkicks.co"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-ink mb-1.5 uppercase tracking-wide">password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-brand-rule rounded-lg px-4 py-3 text-brand-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-rust/40 bg-white"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-ink text-white py-3 rounded-lg font-medium hover:bg-brand-ink/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'signing in…' : 'sign in →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
