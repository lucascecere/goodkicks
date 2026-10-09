'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { renderRepWelcome, repWelcomeSubject } from '@/lib/email/rep-welcome-template';
import type { RealBrand } from '@/lib/admin/brand';
import { greetingName, slugifyCode } from '@/lib/reps/naming';
import { fmtDateTime } from '@/lib/admin/format';
import { MAX_PCT, clampPct } from '@/lib/reps/pct';
import { approveRep } from '@/lib/reps/approve-client';
import { btn, field } from '@/components/admin/ui';

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
        done ? 'bg-emerald-400 text-town-navy' : 'border border-town-cream/20 text-town-cream/50'
      }`}>
        {done ? '✓' : n}
      </div>
      <span className={`text-sm ${done ? 'text-town-cream/45 line-through' : 'font-semibold text-town-cream'}`}>{label}</span>
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
      <label className="mb-1.5 block text-xs text-town-cream/55">{label}</label>
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
          className={`${field} pr-7`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-town-cream/45">%</span>
      </div>
      <p className="mt-1 text-[10px] text-town-cream/45">{hint}</p>
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
      <div className="min-w-0 space-y-5 rounded-xl border border-town-cream/10 bg-town-cream/[0.04] p-4 sm:p-6">
        <h2 className="admin-eyebrow">Onboarding Status</h2>

        <div className="space-y-3">
          <Step n={1} label="Discount code created in Shopify" done={Boolean(app.shopify_discount_gid)} />
          <Step n={2} label="Welcome email sent" done={Boolean(app.welcome_email_sent_at)} />
          <Step n={3} label={isTownies ? 'Town Rep onboarded' : 'Ambassador onboarded'} done />
        </div>

        {!app.shopify_discount_gid && (
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
            <p className="text-[11px] leading-relaxed text-amber-200">
              This rep is approved but their code isn&apos;t linked to a Shopify discount — it was
              either created by hand or the API call was skipped. Changing the discount % here will
              not update Shopify. Link or recreate it from the roster panel.
            </p>
          </div>
        )}

        {/* Email delivery status */}
        <div className="space-y-3 rounded-lg border border-town-cream/15 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="admin-eyebrow mb-1">Welcome Email</p>
              {app.welcome_email_sent_at ? (
                <p className="text-sm font-semibold text-emerald-300">
                  sent {fmtDateTimeWithYear(app.welcome_email_sent_at)}
                </p>
              ) : (
                <p className="text-sm font-semibold text-amber-300">no send record found</p>
              )}
            </div>
            <button
              onClick={handleResend}
              disabled={resending}
              className={`${btn.secondary} shrink-0`}
            >
              {resending ? 'sending…' : 'resend email'}
            </button>
          </div>
          {resendMsg && (
            <p className={`text-xs font-medium ${resendMsg.includes('failed') ? 'text-red-300' : 'text-emerald-300'}`}>
              {resendMsg}
            </p>
          )}
        </div>

        {/* Email preview — rendered from the same template that gets sent */}
        {emailText && (
          <div>
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="text-xs font-semibold text-town-cream hover:underline"
            >
              {showPreview ? 'hide email preview ↑' : 'preview email ↓'}
            </button>
            {showPreview && (
              <div className="mt-3 rounded-lg border border-town-cream/10 bg-town-navy/60 p-4">
                <p className="mb-2 break-words text-xs uppercase tracking-wide text-town-cream/45">
                  To: {app.email} · Subject: {repWelcomeSubject(firstName)}
                </p>
                <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-town-cream/85">
                  {emailText}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3 border-t border-town-cream/10 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="admin-eyebrow">Discount Code</p>
              <p className="break-all font-mono text-lg font-bold text-town-cream">{app.discount_code ?? '—'}</p>
            </div>
            <div>
              <p className="admin-eyebrow">Off / Earns</p>
              <p className="text-lg font-bold text-town-cream">
                {app.discount_pct}% / {app.commission_pct}%
              </p>
            </div>
          </div>
          {app.discount_code && (
            <a
              href={`/ambassador/${app.discount_code.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-town-cream hover:underline"
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
      <div className="min-w-0 rounded-xl border border-town-cream/10 bg-town-cream/[0.04] p-4 sm:p-6">
        <div className="flex items-center gap-2 text-red-300">
          <span className="text-lg">✕</span>
          <p className="font-medium">Application rejected</p>
        </div>
        <p className="mt-2 text-sm text-town-cream/50">This application was rejected. No email was sent.</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 rounded-xl border border-town-cream/10 bg-town-cream/[0.04] p-4 sm:p-6">
      <h2 className="admin-eyebrow">Onboarding Checklist</h2>

      <div className="space-y-3">
        <Step n={1} label="Set the discount + commission rates" />
        <Step n={2} label="Create the code in Shopify" />
        <Step n={3} label="Send the welcome email" />
      </div>

      <div className="space-y-4 border-t border-town-cream/10 pt-5">
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
          <label className="mb-1.5 block text-xs text-town-cream/55">Discount code</label>
          <input
            value={code}
            onChange={(e) => { setCodeTouched(true); setCode(e.target.value.toUpperCase()); }}
            placeholder={suggested || 'e.g. MILTON15'}
            className={`${field} font-mono`}
          />
          <p className="mt-1 text-[11px] text-town-cream/45">
            Created in Shopify limited to the {isTownies ? 'Townies' : 'Good Kicks'} collection, so it
            can&apos;t discount the other brand&apos;s products.
          </p>
        </div>

        {scopeErr && (
          <div className="space-y-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
            <p className="text-[11px] leading-relaxed text-amber-200">{scopeErr}</p>
            <button
              onClick={() => handleApprove(false)}
              disabled={step === 'loading' || !code.trim()}
              className="w-full rounded-lg border border-amber-400/40 px-3 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/10 disabled:opacity-50"
            >
              approve with this code anyway (create it in Shopify by hand)
            </button>
          </div>
        )}
        {err && <p className="text-sm text-red-300">{err}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => handleApprove(true)}
            disabled={step === 'loading'}
            className={`${btn.primary} flex-1`}
          >
            {step === 'loading' ? 'working…' : 'create code, approve & send welcome'}
          </button>
          <button
            onClick={handleReject}
            disabled={rejecting}
            className="inline-flex items-center justify-center rounded-lg border border-red-400/30 px-4 py-2.5 font-label text-xs font-bold uppercase tracking-[0.14em] text-red-300 transition-colors hover:bg-red-400/10 disabled:opacity-50"
          >
            {rejecting ? '…' : 'reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
