'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { renderRepWelcome, repWelcomeSubject } from '@/lib/email/rep-welcome-template';
import type { RealBrand } from '@/lib/admin/brand';
import { greetingName, slugifyCode } from '@/lib/reps/naming';
import { fmtDateTime } from '@/lib/admin/format';
import { MAX_PCT, clampPct } from '@/lib/reps/pct';
import { approveRep } from '@/lib/reps/approve-client';

/** This panel keeps the year — a welcome email sent last season should not read as this week. */
const fmtDateTimeWithYear = (iso: string) => fmtDateTime(iso, { year: true });

interface App {
  id: string;
  name: string;
  email: string;
  instagram: string;
  brand: RealBrand;
  town: string | null;
  hat_preference: string | null;
  colorway_preference: string | null;
  approved: boolean;
  status: string | null;
  discount_code: string | null;
  discount_pct: number;
  commission_pct: number;
  shopify_discount_gid: string | null;
  hat_delivered: boolean;
  age: number | null;
  welcome_email_sent_at: string | null;
}


function suggestCode(app: App, discountPct: number): string {
  const slug = slugifyCode(app.instagram || app.name);
  return slug ? `${slug}${discountPct}` : '';
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

function PctField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-brand-muted block mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          min={0}
          max={MAX_PCT}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(clampPct(n));
          }}
          className="w-full border border-brand-rule rounded-lg px-3 py-2 pr-7 text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-rust/30"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-brand-muted pointer-events-none">%</span>
      </div>
      <p className="text-[10px] text-brand-muted mt-1">{hint}</p>
    </div>
  );
}

export function OnboardingPanel({ app }: { app: App }) {
  const router = useRouter();
  const isTownies = app.brand === 'townies';
  const isApproved = app.approved;
  const isRejected = app.status === 'rejected';

  const [discountPct, setDiscountPct] = useState(app.discount_pct);
  const [commissionPct, setCommissionPct] = useState(app.commission_pct);
  const [code, setCode] = useState(app.discount_code ?? '');
  const [codeTouched, setCodeTouched] = useState(Boolean(app.discount_code));
  const [step, setStep] = useState<'idle' | 'loading' | 'error'>('idle');
  const [err, setErr] = useState('');
  const [scopeErr, setScopeErr] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const suggested = suggestCode(app, discountPct);
  useEffect(() => {
    if (!codeTouched) setCode(suggested);
  }, [suggested, codeTouched]);

  async function handleApprove(createInShopify: boolean) {
    if (!createInShopify && !code.trim()) {
      setErr('enter a discount code first.');
      return;
    }
    setStep('loading');
    setErr('');
    setScopeErr('');
    const result = await approveRep({
      applicationId: app.id,
      discountCode: code,
      discountPct,
      commissionPct,
      createInShopify,
    });
    if (result.ok) {
      router.refresh();
      return;
    }
    setStep('error');
    if (result.kind === 'scope') setScopeErr(result.message);
    else setErr(result.message);
  }

  async function handleReject() {
    setRejecting(true);
    const res = await fetch('/api/admin/reject-ambassador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id }),
    });
    if (res.ok) router.refresh();
    else setRejecting(false);
  }

  async function handleResend() {
    setResending(true);
    setResendMsg('');
    const res = await fetch('/api/admin/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id }),
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
    const firstName = greetingName(app.name);
    const isMinor = typeof app.age === 'number' && app.age < 18;
    const emailText = isTownies
      ? renderRepWelcome({
          firstName,
          town: app.town ?? '',
          discountCode: app.discount_code ?? '',
          discountPct: app.discount_pct,
          commissionPct: app.commission_pct,
          isMinor,
          hatDelivered: app.hat_delivered,
        })
      : null;

    return (
      <div className="bg-white rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-medium text-brand-ink uppercase tracking-wide">Onboarding Status</h2>

        <div className="space-y-3">
          <Step n={1} label="Discount code created in Shopify" done={Boolean(app.shopify_discount_gid)} />
          <Step n={2} label="Welcome email sent" done={Boolean(app.welcome_email_sent_at)} />
          <Step n={3} label={isTownies ? 'Town Rep onboarded' : 'Ambassador onboarded'} done />
        </div>

        {!app.shopify_discount_gid && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-[11px] text-amber-800 leading-relaxed">
              This rep is approved but their code isn&apos;t linked to a Shopify discount — it was
              either created by hand or the API call was skipped. Changing the discount % here will
              not update Shopify. Link or recreate it from the roster panel.
            </p>
          </div>
        )}

        {/* Email delivery status */}
        <div className="border border-brand-rule rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-brand-muted uppercase tracking-wide mb-0.5">Welcome Email</p>
              {app.welcome_email_sent_at ? (
                <p className="text-sm text-green-700 font-medium">
                  sent {fmtDateTimeWithYear(app.welcome_email_sent_at)}
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

        {/* Email preview — rendered from the same template that gets sent */}
        {emailText && (
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
                  To: {app.email} · Subject: {repWelcomeSubject(firstName)}
                </p>
                <pre className="text-xs text-brand-ink whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
                  {emailText}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-brand-rule pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-brand-muted uppercase tracking-wide">Discount Code</p>
              <p className="font-mono text-lg font-bold text-brand-ink">{app.discount_code ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-brand-muted uppercase tracking-wide">Off / Earns</p>
              <p className="text-lg font-bold text-brand-ink">
                {app.discount_pct}% / {app.commission_pct}%
              </p>
            </div>
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
        <Step n={1} label="Set the discount + commission rates" />
        <Step n={2} label="Create the code in Shopify" />
        <Step n={3} label="Send the welcome email" />
      </div>

      <div className="border-t border-brand-rule pt-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <PctField
            label="Customer discount"
            hint="what followers save"
            value={discountPct}
            onChange={setDiscountPct}
          />
          <PctField
            label="Rep commission"
            hint="% of revenue driven"
            value={commissionPct}
            onChange={setCommissionPct}
          />
        </div>

        <div>
          <label className="text-xs text-brand-muted block mb-1">Discount code</label>
          <input
            value={code}
            onChange={(e) => { setCodeTouched(true); setCode(e.target.value.toUpperCase()); }}
            placeholder={suggested || 'e.g. MILTON15'}
            className="w-full border border-brand-rule rounded-lg px-3 py-2 text-sm font-mono text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-rust/30"
          />
          <p className="text-[11px] text-brand-muted mt-1">
            Created in Shopify limited to the {isTownies ? 'Townies' : 'Good Kicks'} collection, so it
            can&apos;t discount the other brand&apos;s products.
          </p>
        </div>

        {scopeErr && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
            <p className="text-[11px] text-amber-800 leading-relaxed">{scopeErr}</p>
            <button
              onClick={() => handleApprove(false)}
              disabled={step === 'loading' || !code.trim()}
              className="w-full border border-amber-300 text-amber-800 rounded-lg px-3 py-2 text-xs font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              approve with this code anyway (create it in Shopify by hand)
            </button>
          </div>
        )}
        {err && <p className="text-sm text-red-500">{err}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => handleApprove(true)}
            disabled={step === 'loading'}
            className="flex-1 bg-brand-rust text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-brand-rust/90 transition-colors disabled:opacity-50"
          >
            {step === 'loading' ? 'working…' : 'create code, approve & send welcome'}
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
