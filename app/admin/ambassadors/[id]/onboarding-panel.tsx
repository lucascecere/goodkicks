'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface App {
  id: string;
  name: string;
  email: string;
  instagram: string;
  colorway_preference: string | null;
  approved: boolean;
  status: string | null;
  discount_code: string | null;
  tier_pct: number;
  welcome_email_sent_at: string | null;
}

const STARTER_COMMISSION = 8;
const STARTER_DISCOUNT   = 15;

const EMAIL_TEMPLATE = `hey {{first_name}}, welcome to the Good Kicks team. ✌️

you're officially a Good Kicks ambassador. your {{colorway}} sack is on its way — no cost to you, that's your starter kit.

────────────────────────
your discount code: {{discount_code}}
────────────────────────

share this code with anyone. every time someone uses it, they get {{discount_pct}}% off — and you earn {{commission_pct}}% commission on every order. the more you push it, the more you earn.

━━━ THE THREE REQUIREMENTS ━━━

these aren't optional — they're how the program works:

1. link in bio
   your discount code link lives in your bio. always. that's your storefront.

2. code in bio
   add this exact line to your instagram bio:
   "@goodkicksco ambassador | use code '{{discount_code}}'"
   make it dead simple for people to find it.

3. mentioned in every video
   every time you post something related to the sack, give us a shoutout. it doesn't have to be a dedicated video — just a mention, a tag, a caption. stay consistent.

━━━ YOUR STATS PAGE ━━━

bookmark this link — it's your personal dashboard showing every order driven by your code, total revenue, and commission earned in real time:

goodkicks.co/ambassador/{{discount_code_lower}}

━━━ HOW YOU GROW ━━━

your tier is based on total sales driven through your code:

  starter  → 0–10 orders    → 8% commission  (your code gives followers 15% off)
  repping  → 11–30 orders   → 12% commission (code bumps to 20% off)
  anchor   → 31+ orders     → 20% commission (code bumps to 25% off)

you move up automatically as your numbers grow.

━━━ HOW TO GET STARTED ━━━

1. drop your code link in your bio today
2. add this to your instagram bio: "@goodkicksco ambassador | use code '{{discount_code}}'"
3. post your sack when it arrives and tag @goodkicksco
4. use #goodkicks so we can find and repost your content
5. mention us every time you post — keep it natural, keep it consistent

that's it. no complicated rules. just keep the circle going.

questions? just reply to this email — we check it.

make the circle bigger.

— The Good Kicks Team
goodkicks.co | @goodkicksco`;

function renderEmail(app: App): string {
  const firstName = app.name.split(' ')[0];
  const code = app.discount_code ?? '';
  const colorway = app.colorway_preference ?? 'your choice';
  return EMAIL_TEMPLATE
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{discount_code\}\}/g, code)
    .replace(/\{\{discount_code_lower\}\}/g, code.toLowerCase())
    .replace(/\{\{colorway\}\}/g, colorway)
    .replace(/\{\{discount_pct\}\}/g, String(STARTER_DISCOUNT))
    .replace(/\{\{commission_pct\}\}/g, String(STARTER_COMMISSION));
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function Step({ n, label, done }: { n: number; label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        done ? 'bg-green-500 text-white' : 'bg-brand-rule text-brand-muted'
      }`}>
        {done ? '✓' : n}
      </div>
      <span className={`text-sm ${done ? 'text-brand-muted line-through' : 'text-brand-ink font-medium'}`}>{label}</span>
    </div>
  );
}

export function OnboardingPanel({ app }: { app: App }) {
  const router = useRouter();
  const suggested = app.instagram.replace(/^@/, '').toUpperCase().replace(/[^A-Z0-9]/g, '') + '15';
  const [code, setCode] = useState(app.discount_code ?? suggested);
  const [step, setStep] = useState<'idle' | 'loading' | 'error'>('idle');
  const [err, setErr] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const isApproved = app.approved;
  const isRejected = app.status === 'rejected';

  async function handleApprove() {
    if (!code.trim()) { setErr('enter the discount code you created in Shopify first.'); return; }
    setStep('loading');
    setErr('');
    const res = await fetch('/api/admin/approve-ambassador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id, discountCode: code.trim().toUpperCase(), tierPct: STARTER_COMMISSION }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setErr(json.error ?? 'something went wrong');
      setStep('error');
    }
  }

  async function handleReject() {
    setRejecting(true);
    const res = await fetch('/api/admin/reject-ambassador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setRejecting(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMsg('');
    const firstName = app.name.split(' ')[0];
    const res = await fetch('/api/admin/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: app.id,
        firstName,
        email: app.email,
        discountCode: app.discount_code,
        colorway: app.colorway_preference ?? 'your choice',
        tierPct: app.tier_pct,
      }),
    });
    setResending(false);
    if (res.ok) {
      setResendMsg('email sent!');
      router.refresh();
    } else {
      setResendMsg('send failed — check Resend logs.');
    }
  }

  if (isApproved) {
    const emailText = renderEmail(app);
    return (
      <div className="bg-white rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-medium text-brand-ink uppercase tracking-wide">Onboarding Status</h2>

        <div className="space-y-3">
          <Step n={1} label="Shopify discount code created" done />
          <Step n={2} label="Welcome email sent" done />
          <Step n={3} label="Ambassador onboarded" done />
        </div>

        {/* Email delivery status */}
        <div className="border border-brand-rule rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-brand-muted uppercase tracking-wide mb-0.5">Welcome Email</p>
              {app.welcome_email_sent_at ? (
                <p className="text-sm text-green-700 font-medium">
                  sent {fmtDateTime(app.welcome_email_sent_at)}
                </p>
              ) : (
                <p className="text-sm text-amber-600 font-medium">no send record found</p>
              )}
            </div>
            <button
              onClick={handleResend}
              disabled={resending}
              className="shrink-0 text-xs border border-brand-rule rounded-lg px-3 py-1.5 text-brand-ink hover:bg-brand-rule/30 transition-colors disabled:opacity-50"
            >
              {resending ? 'sending…' : 'resend email'}
            </button>
          </div>
          {resendMsg && (
            <p className={`text-xs font-medium ${resendMsg.includes('failed') ? 'text-red-500' : 'text-green-600'}`}>
              {resendMsg}
            </p>
          )}
        </div>

        {/* Email preview */}
        <div>
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs text-brand-rust hover:underline"
          >
            {showPreview ? 'hide email preview ↑' : 'preview email ↓'}
          </button>
          {showPreview && (
            <div className="mt-3 bg-brand-rule/20 rounded-lg p-4 border border-brand-rule">
              <p className="text-xs text-brand-muted uppercase tracking-wide mb-2">
                To: {app.email} · Subject: welcome to the team, {app.name.split(' ')[0]}. ✌️
              </p>
              <pre className="text-xs text-brand-ink whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
                {emailText}
              </pre>
            </div>
          )}
        </div>

        <div className="border-t border-brand-rule pt-4 space-y-3">
          <div>
            <p className="text-xs text-brand-muted uppercase tracking-wide">Discount Code</p>
            <p className="font-mono text-lg font-bold text-brand-ink">{app.discount_code ?? '—'}</p>
          </div>
          {app.discount_code && (
            <a
              href={`/ambassador/${app.discount_code.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-brand-rust hover:underline"
            >
              view stats page →
            </a>
          )}
        </div>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center gap-2 text-red-600">
          <span className="text-lg">✕</span>
          <p className="font-medium">Application rejected</p>
        </div>
        <p className="text-brand-muted text-sm mt-2">This application was rejected. No email was sent.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 space-y-6">
      <h2 className="text-sm font-medium text-brand-ink uppercase tracking-wide">Onboarding Checklist</h2>

      <div className="space-y-3">
        <Step n={1} label="Create discount code in Shopify" />
        <Step n={2} label="Enter discount code below" />
        <Step n={3} label="Send welcome email" />
      </div>

      <div className="border-t border-brand-rule pt-5 space-y-4">
        <div>
          <p className="text-xs text-brand-muted mb-1">Suggested code</p>
          <p className="font-mono text-sm font-bold text-brand-ink bg-brand-rule/30 px-3 py-2 rounded">{suggested}</p>
          <p className="text-[11px] text-brand-muted mt-1">Create this exact code in Shopify → Discounts before approving.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-brand-muted block mb-1">Discount code (from Shopify)</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. JOHNDOE15"
              className="w-full border border-brand-rule rounded-lg px-3 py-2 text-sm font-mono text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-rust/30"
            />
          </div>
          <p className="text-[11px] text-brand-muted">
            All new ambassadors start at <strong>Starter tier</strong> — 15% customer discount, 8% commission. Tier advances automatically based on order count.
          </p>
        </div>

        {err && <p className="text-sm text-red-500">{err}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleApprove}
            disabled={step === 'loading'}
            className="flex-1 bg-brand-rust text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-brand-rust/90 transition-colors disabled:opacity-50"
          >
            {step === 'loading' ? 'sending…' : 'approve & send welcome email'}
          </button>
          <button
            onClick={handleReject}
            disabled={rejecting}
            className="px-4 py-2.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {rejecting ? '…' : 'reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
