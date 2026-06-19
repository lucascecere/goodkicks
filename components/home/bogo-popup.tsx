'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const BOGO_CODE = 'BOGOKICKS';

export function BogoPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'offer' | 'success'>('offer');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('gk_bogo_v1');
    if (stored) {
      const seenAt = parseInt(stored, 10);
      if (Date.now() - seenAt < 30 * 24 * 60 * 60 * 1000) return;
    }
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    localStorage.setItem('gk_bogo_v1', Date.now().toString());
    setVisible(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch('/api/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, discountCode: BOGO_CODE, discountLabel: 'buy one get one free' }),
      });
    } catch {}
    setSending(false);
    setStep('success');
    localStorage.setItem('gk_bogo_v1', Date.now().toString());
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-ink/70 backdrop-blur-sm" onClick={dismiss} />

      <div className="relative bg-brand-cream rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 p-1.5 text-brand-muted hover:text-brand-ink transition-colors rounded-full hover:bg-brand-rule"
        >
          <X size={18} />
        </button>

        <div className="px-6 pt-8 pb-6 space-y-5">
          {step === 'offer' ? (
            <>
              <div className="text-center space-y-2">
                <span className="inline-block bg-brand-green text-white text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full">limited time</span>
                <h2 className="font-display text-4xl text-brand-ink leading-tight">buy one,<br />get one free.</h2>
                <p className="text-brand-muted text-sm">two sacks for the price of one. drop your email and we&apos;ll send your code.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-brand-rule rounded-lg px-4 py-3 text-brand-ink placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-rust/40 bg-white"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-brand-green text-white py-3.5 rounded-lg font-medium text-lg hover:bg-brand-green/90 transition-colors disabled:opacity-60"
                >
                  {sending ? 'sending…' : 'get my free sack →'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-brand-muted text-sm">code on its way to your inbox — here it is too:</p>
              <div className="bg-brand-ink text-brand-cream rounded-xl py-5 px-6">
                <p className="text-xs uppercase tracking-widest text-brand-cream/50 mb-2">your code</p>
                <p className="font-display text-3xl tracking-widest">{BOGO_CODE}</p>
              </div>
              <p className="text-brand-muted text-xs">add 2 sacks to your cart · enter code at checkout · second one&apos;s free.</p>
              <button
                onClick={dismiss}
                className="w-full bg-brand-green text-white py-3.5 rounded-lg font-medium text-lg hover:bg-brand-green/90 transition-colors"
              >
                shop now →
              </button>
            </div>
          )}

          <button onClick={dismiss} className="w-full text-center text-brand-muted text-xs hover:text-brand-ink transition-colors py-1">
            no thanks
          </button>
        </div>
      </div>
    </div>
  );
}
