'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BrandBadge } from '@/components/admin/brand-badge';
import { RepTabs } from './rep-tabs';
import { AddRepForm, type NewRep } from './add-rep-form';
import type { AdminBrand, RealBrand } from '@/lib/admin/brand';
import type { DiscountReadiness } from '@/lib/shopify/discount-readiness';
import { codeSuggestions, greetingName } from '@/lib/reps/naming';
import { renderRepWelcome, repWelcomeSubject } from '@/lib/email/rep-welcome-template';
import { parseTowns } from '@/lib/reps/towns';
import { fmtDate, fmtDateTime } from '@/lib/admin/format';
import { MAX_PCT, clampPct } from '@/lib/reps/pct';
import { accountTypeLabel, followerLabel, repFieldLabels } from '@/lib/reps/labels';

type Ambassador = {
  id: string;
  name: string;
  email: string;
  instagram: string;
  brand: RealBrand | null;
  town: string | null;
  school: string | null;
  hat_preference: string | null;
  account_type: string | null;
  followers: string | null;
  colorway_preference: string | null;
  shipping_address: string | null;
  approved: boolean;
  status: string | null;
  discount_code: string | null;
  discount_pct: number | null;
  commission_pct: number | null;
  tier_pct: number | null;
  shopify_discount_gid: string | null;
  hat_delivered: boolean | null;
  // Under 18 gets the store-credit wording instead of cash commission, so the
  // preview needs it to match what actually sends.
  age: number | null;
  created_at: string | null;
  welcome_email_sent_at: string | null;
};

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

// Display-only: what the preview header shows as the sender. The actual send
// uses TOWNIES_FROM_EMAIL server-side, defaulting to the same address.
const TOWNIES_FROM_HINT =
  process.env.NEXT_PUBLIC_TOWNIES_FROM_EMAIL || 'info@goodkicks.co';

// Program ceiling — a rep never earns or discounts more than this.
const DEFAULT_DISCOUNT = 15;
const DEFAULT_COMMISSION = 10;

function repBrand(app: Ambassador): RealBrand {
  return app.brand === 'townies' ? 'townies' : 'goodkicks';
}

function repSuggestions(app: Ambassador, discountPct: number) {
  return codeSuggestions({
    instagram: app.instagram,
    name: app.name,
    towns: parseTowns(app.town),
    discountPct,
  });
}

function StatusBadge({ app }: { app: Ambassador }) {
  if (app.approved) return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">approved</span>;
  if (app.status === 'rejected') return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-600">rejected</span>;
  return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">pending</span>;
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-brand-muted mb-0.5">{label}</p>
      <p className="text-sm text-brand-ink">{value}</p>
    </div>
  );
}

/** Numeric percentage field clamped to the program ceiling. */
function PctInput({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-brand-muted block mb-1">
        {label}
        {hint && <span className="text-brand-muted/70"> · {hint}</span>}
      </label>
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
    </div>
  );
}

function RightPanel({
  app,
  discounts,
  onUpdate,
  onDelete,
  onClose,
}: {
  app: Ambassador;
  discounts: DiscountReadiness;
  onUpdate: (id: string, fields: Partial<Ambassador>) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}) {
  const brand = repBrand(app);
  const isTownies = brand === 'townies';
  const labels = repFieldLabels(brand);

  const [discountPct, setDiscountPct] = useState(app.discount_pct ?? DEFAULT_DISCOUNT);
  const [commissionPct, setCommissionPct] = useState(
    app.commission_pct ?? app.tier_pct ?? DEFAULT_COMMISSION,
  );
  const [approveCode, setApproveCode] = useState(app.discount_code ?? '');
  const [codeTouched, setCodeTouched] = useState(Boolean(app.discount_code));
  const [approving, setApproving] = useState(false);
  const [approveErr, setApproveErr] = useState('');
  const [scopeErr, setScopeErr] = useState('');
  const [editEmail, setEditEmail] = useState(app.email ?? '');
  const [editCode, setEditCode] = useState(app.discount_code ?? '');

  // Until the admin types their own code, keep the suggestion in step with the
  // discount they've chosen (@southshoreguys at 15% off → SOUTHSHOREGUYS15).
  const suggestions = repSuggestions(app, discountPct);
  const suggested = suggestions[0]?.code ?? '';
  useEffect(() => {
    if (!codeTouched) setApproveCode(suggested);
  }, [suggested, codeTouched]);

  useEffect(() => { setEditEmail(app.email ?? ''); }, [app.email]);
  useEffect(() => { setEditCode(app.discount_code ?? ''); }, [app.discount_code]);
  useEffect(() => { setDiscountPct(app.discount_pct ?? DEFAULT_DISCOUNT); }, [app.discount_pct]);
  useEffect(() => {
    setCommissionPct(app.commission_pct ?? app.tier_pct ?? DEFAULT_COMMISSION);
  }, [app.commission_pct, app.tier_pct]);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleApprove(createInShopify: boolean) {
    if (!createInShopify && !approveCode.trim()) {
      setApproveErr('enter the discount code first');
      return;
    }
    setApproving(true);
    setApproveErr('');
    setScopeErr('');

    const res = await fetch('/api/admin/approve-ambassador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: app.id,
        discountCode: approveCode.trim().toUpperCase(),
        discountPct,
        commissionPct,
        createInShopify,
      }),
    });
    setApproving(false);

    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      onUpdate(app.id, {
        approved: true,
        status: 'approved',
        discount_code: json.discountCode ?? approveCode.trim().toUpperCase(),
        discount_pct: discountPct,
        commission_pct: commissionPct,
        shopify_discount_gid: json.gid ?? app.shopify_discount_gid,
      });
      return;
    }
    if (json.code === 'shopify_scope' || json.code === 'shopify_unconfigured') {
      setScopeErr(json.error);
    } else {
      setApproveErr(json.error ?? 'something went wrong');
    }
  }

  async function handleCreateCodeOnly() {
    setApproving(true);
    setApproveErr('');
    setScopeErr('');
    const res = await fetch('/api/admin/create-discount-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id, code: approveCode.trim(), discountPct }),
    });
    setApproving(false);
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setApproveCode(json.code);
      setCodeTouched(true);
      onUpdate(app.id, {
        discount_code: json.code,
        discount_pct: discountPct,
        shopify_discount_gid: json.gid,
      });
    } else if (json.code === 'shopify_scope' || json.code === 'shopify_unconfigured') {
      setScopeErr(json.error);
    } else {
      setApproveErr(json.error ?? 'something went wrong');
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg('');
    const res = await fetch('/api/admin/update-ambassador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: app.id,
        email: editEmail.trim() || null,
        discount_code: editCode.trim().toUpperCase() || null,
        discount_pct: discountPct,
        commission_pct: commissionPct,
      }),
    });
    setSaving(false);
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setSaveMsg(json.shopifyWarning ? 'saved (Shopify not synced)' : 'saved');
      if (json.shopifyWarning) setApproveErr(json.shopifyWarning);
      onUpdate(app.id, {
        email: editEmail.trim() || app.email,
        discount_code: editCode.trim().toUpperCase() || null,
        discount_pct: discountPct,
        commission_pct: commissionPct,
      });
      setTimeout(() => setSaveMsg(''), 3000);
    } else {
      setSaveMsg(json.error ?? 'save failed');
    }
  }

  async function handleResendWelcome() {
    setSaving(true);
    const res = await fetch('/api/admin/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMsg('welcome email sent');
      onUpdate(app.id, { welcome_email_sent_at: new Date().toISOString() });
      setTimeout(() => setSaveMsg(''), 3000);
    } else {
      setSaveMsg('send failed');
    }
  }

  async function handleStatusChange(newStatus: 'approved' | 'rejected' | 'pending') {
    const approved = newStatus === 'approved';
    const status = newStatus === 'pending' ? null : newStatus;
    const res = await fetch('/api/admin/update-ambassador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id, approved, status }),
    });
    if (res.ok) onUpdate(app.id, { approved, status });
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch('/api/admin/delete-ambassador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id }),
    });
    if (res.ok) {
      onDelete(app.id);
      onClose?.();
    } else {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-5 border-b border-brand-rule">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl text-brand-ink leading-tight">{app.name}</h2>
            <a href={`mailto:${app.email}`} className="text-xs text-brand-muted hover:text-brand-rust transition-colors truncate block">{app.email}</a>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <BrandBadge brand={brand} />
            <StatusBadge app={app} />
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden text-brand-muted hover:text-brand-ink p-1 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        {app.instagram && (
          <a
            href={`https://instagram.com/${app.instagram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-rust hover:underline"
          >
            {app.instagram} ↗
          </a>
        )}
      </div>

      {/* Rates — the two numbers that drive everything else */}
      <div className="p-5 border-b border-brand-rule space-y-3">
        <p className="text-[10px] uppercase tracking-wider text-brand-muted font-medium">Rates</p>
        <div className="grid grid-cols-2 gap-3">
          <PctInput label="Customer discount" hint="off" value={discountPct} onChange={setDiscountPct} />
          <PctInput label="Rep commission" hint="of revenue" value={commissionPct} onChange={setCommissionPct} />
        </div>
        <p className="text-[11px] text-brand-muted leading-relaxed">
          Followers save {discountPct}% on {isTownies ? 'Townies hats' : 'Good Kicks gear'}; the rep earns{' '}
          {commissionPct}% of what those orders actually bring in. Max {MAX_PCT}% either way.
        </p>
      </div>

      {/* Approve flow */}
      {!app.approved && app.status !== 'rejected' && (
        <div className="p-5 border-b border-brand-rule space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-brand-muted font-medium">
            Approve {isTownies ? 'Town Rep' : 'Ambassador'}
          </p>
          <div>
            <label className="text-xs text-brand-muted block mb-1">Discount code</label>
            <input
              value={approveCode}
              onChange={(e) => { setCodeTouched(true); setApproveCode(e.target.value.toUpperCase()); }}
              placeholder={suggested || 'e.g. SOUTHSHOREGUYS15'}
              className="w-full border border-brand-rule rounded-lg px-3 py-2 text-sm font-mono text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-rust/30"
            />
            {suggestions.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => { setCodeTouched(true); setApproveCode(s.code); }}
                    className={`font-mono text-[10px] px-2 py-1 rounded border transition-colors ${
                      approveCode === s.code
                        ? 'bg-brand-ink text-white border-brand-ink'
                        : 'border-brand-rule text-brand-muted hover:border-brand-ink hover:text-brand-ink'
                    }`}
                  >
                    {s.code}
                    <span className="opacity-50"> · {s.label}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] text-brand-muted mt-1.5">
              Built from their handle, not their town — type anything you like. Created in Shopify
              scoped to the {isTownies ? 'Townies' : 'Good Kicks'} collection only.
            </p>
          </div>
          {isTownies && (
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(app.hat_delivered)}
                onChange={async (e) => {
                  const hat_delivered = e.target.checked;
                  onUpdate(app.id, { hat_delivered });
                  await fetch('/api/admin/update-ambassador', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ applicationId: app.id, hat_delivered }),
                  });
                }}
                className="mt-0.5 shrink-0"
              />
              <span className="text-[11px] text-brand-ink leading-relaxed">
                They already have their hat
                <span className="text-brand-muted"> — changes what the welcome email says.</span>
              </span>
            </label>
          )}
          {/* Known up front, so the by-hand route is the primary flow rather
              than something discovered by failing once per rep. */}
          {!discounts.ready && !scopeErr && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {discounts.reason} Create <strong className="font-mono">{approveCode || suggested}</strong> in
                Shopify first, set to <strong>{discountPct}% off</strong> the{' '}
                {isTownies ? 'Townies' : 'Good Kicks'} collection, then approve below.
              </p>
              <a
                href={discounts.discountsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center border border-amber-300 text-amber-800 rounded-lg px-3 py-2 text-xs font-medium hover:bg-amber-100 transition-colors"
              >
                open Shopify Discounts ↗
              </a>
            </div>
          )}
          {scopeErr && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <p className="text-[11px] text-amber-800 leading-relaxed">{scopeErr}</p>
              <a
                href={discounts.discountsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center border border-amber-300 text-amber-800 rounded-lg px-3 py-2 text-xs font-medium hover:bg-amber-100 transition-colors"
              >
                open Shopify Discounts ↗
              </a>
              <button
                onClick={() => handleApprove(false)}
                disabled={approving || !approveCode.trim()}
                className="w-full border border-amber-300 text-amber-800 rounded-lg px-3 py-2 text-xs font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                approve with this code anyway
              </button>
            </div>
          )}
          {/* Read the email BEFORE it goes out — approving sends it, so a
              preview that only appears afterwards is too late to be useful. */}
          {isTownies && (
            <div>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="text-xs text-brand-rust hover:underline"
              >
                {showPreview ? 'hide the email they’ll get ↑' : 'read the email they’ll get ↓'}
              </button>
              {showPreview && (
                <div className="mt-2 bg-brand-rule/20 rounded-lg p-3 border border-brand-rule">
                  <p className="text-[10px] text-brand-muted uppercase tracking-wide mb-2 leading-relaxed">
                    From: Townies &lt;{TOWNIES_FROM_HINT}&gt;<br />
                    To: {app.email}<br />
                    Subject: {repWelcomeSubject(greetingName(app.name))}
                  </p>
                  <pre className="text-[11px] text-brand-ink whitespace-pre-wrap font-mono leading-relaxed max-h-72 overflow-y-auto">
                    {renderRepWelcome({
                      firstName: greetingName(app.name),
                      town: app.town ?? '',
                      discountCode: approveCode || suggested,
                      discountPct,
                      commissionPct,
                      isMinor: typeof app.age === 'number' && app.age < 18,
                      hatDelivered: Boolean(app.hat_delivered),
                    })}
                  </pre>
                </div>
              )}
            </div>
          )}
          {approveErr && <p className="text-xs text-red-500">{approveErr}</p>}
          <button
            onClick={() => handleApprove(discounts.ready)}
            disabled={approving || (!discounts.ready && !approveCode.trim())}
            className="w-full bg-brand-rust text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-brand-rust/90 transition-colors disabled:opacity-50"
          >
            {approving
              ? 'working…'
              : discounts.ready
                ? 'create code in Shopify, approve & send welcome'
                : 'approve & send welcome'}
          </button>
        </div>
      )}

      {/* Details */}
      <div className="p-5 space-y-3 border-b border-brand-rule">
        <p className="text-[10px] uppercase tracking-wider text-brand-muted font-medium">Profile</p>
        <div className="grid grid-cols-2 gap-3">
          <DetailRow label={labels.place} value={isTownies ? app.town : app.school} />
          <DetailRow label="Account Type" value={accountTypeLabel(app.account_type)} />
          <DetailRow label="Followers" value={followerLabel(app.followers)} />
          <DetailRow
            label={labels.preference}
            value={isTownies ? app.hat_preference : app.colorway_preference}
          />
        </div>
        <DetailRow label="Shipping Address" value={app.shipping_address} />
        {app.created_at && <DetailRow label="Applied" value={fmtDate(app.created_at)} />}
        {app.welcome_email_sent_at && (
          <DetailRow label="Welcome Email Sent" value={fmtDateTime(app.welcome_email_sent_at)} />
        )}
      </div>

      {/* Email */}
      <div className="p-5 space-y-2 border-b border-brand-rule">
        <p className="text-[10px] uppercase tracking-wider text-brand-muted font-medium">Email</p>
        <div className="flex items-center gap-2">
          <input
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 border border-brand-rule rounded-lg px-3 py-2 text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-rust/30"
          />
          <button
            onClick={async () => {
              if (!editEmail.trim()) return;
              const res = await fetch('/api/admin/update-ambassador', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: app.id, email: editEmail.trim() }),
              });
              if (res.ok) onUpdate(app.id, { email: editEmail.trim() });
            }}
            className="shrink-0 bg-brand-ink text-white rounded-lg px-3 py-2 text-xs font-medium hover:bg-brand-ink/90 transition-colors"
          >
            save
          </button>
        </div>
      </div>

      {/* Code + rates for approved reps */}
      {app.approved && (
        <div className="p-5 space-y-3 border-b border-brand-rule">
          <p className="text-[10px] uppercase tracking-wider text-brand-muted font-medium">Discount Code</p>
          <div>
            <input
              value={editCode}
              onChange={(e) => setEditCode(e.target.value.toUpperCase())}
              placeholder="e.g. MILTON15"
              className="w-full border border-brand-rule rounded-lg px-3 py-2 text-sm font-mono text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-rust/30"
            />
            <p className="text-[11px] text-brand-muted mt-1">
              {app.shopify_discount_gid
                ? 'Linked to Shopify — changing the discount % above updates the live code.'
                : 'Not linked to a Shopify discount yet.'}
            </p>
          </div>
          {!app.shopify_discount_gid && (
            <button
              onClick={handleCreateCodeOnly}
              disabled={approving}
              className="w-full border border-brand-rule text-brand-ink rounded-lg px-4 py-2 text-sm hover:border-brand-ink transition-colors disabled:opacity-50"
            >
              {approving ? 'creating…' : 'create this code in Shopify'}
            </button>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-brand-ink text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-ink/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'saving…' : 'save code & rates'}
            </button>
            {saveMsg && (
              <span className={`text-xs font-medium ${saveMsg.startsWith('saved') || saveMsg.includes('sent') ? 'text-green-600' : 'text-red-500'}`}>
                {saveMsg}
              </span>
            )}
          </div>
          <button
            onClick={handleResendWelcome}
            disabled={saving}
            className="w-full border border-brand-rule text-brand-muted rounded-lg px-4 py-2 text-xs hover:text-brand-ink hover:border-brand-ink transition-colors disabled:opacity-50"
          >
            resend welcome email
          </button>
          {app.discount_code && (
            <a
              href={`/ambassador/${app.discount_code.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-rust hover:underline block"
            >
              view their stats page →
            </a>
          )}
        </div>
      )}

      {/* Status controls */}
      <div className="p-5 space-y-3 border-b border-brand-rule">
        <p className="text-[10px] uppercase tracking-wider text-brand-muted font-medium">Change Status</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusChange('pending')}
            disabled={!app.approved && app.status !== 'rejected'}
            className="flex-1 text-xs py-2.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            set pending
          </button>
          <button
            onClick={() => handleStatusChange('rejected')}
            disabled={app.status === 'rejected'}
            className="flex-1 text-xs py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            reject
          </button>
        </div>
      </div>

      {/* Full detail link + delete */}
      <div className="p-5 space-y-3 mt-auto">
        <Link
          href={`/admin/ambassadors/${app.id}`}
          className="block w-full text-center text-sm border border-brand-rule rounded-lg px-4 py-2.5 text-brand-muted hover:text-brand-ink hover:border-brand-ink transition-colors"
        >
          open full detail page →
        </Link>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="block w-full text-center text-xs text-red-400 hover:text-red-600 transition-colors py-1"
          >
            delete rep
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
            <p className="text-xs text-red-700 font-medium">
              Permanently delete {app.name}? This cannot be undone. Their Shopify discount code is
              not removed — delete it in Shopify too if you want it dead.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white rounded px-3 py-2 text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'deleting…' : 'yes, delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 border border-red-200 text-red-600 rounded px-3 py-2 text-xs hover:bg-white transition-colors"
              >
                cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyPanel({ stats }: { stats: { total: number; approved: number; pending: number; rejected: number } }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-4">
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Approved', value: stats.approved },
          { label: 'Pending', value: stats.pending },
          { label: 'Rejected', value: stats.rejected },
        ].map((s) => (
          <div key={s.label} className="bg-brand-rule/30 rounded-xl p-4">
            <p className="text-2xl font-bold text-brand-ink">{s.value}</p>
            <p className="text-xs text-brand-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="text-brand-muted text-sm mt-2">select a rep to manage</p>
    </div>
  );
}

export function AmbassadorsClient({
  initial,
  brand,
  discounts,
}: {
  initial: Ambassador[];
  brand: AdminBrand;
  discounts: DiscountReadiness;
}) {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>(initial);
  const [selected, setSelected] = useState<Ambassador | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [adding, setAdding] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // A brand switch re-renders the server component with a fresh list.
  useEffect(() => {
    setAmbassadors(initial);
    setSelected(null);
    setSheetOpen(false);
  }, [initial]);

  // A newly added rep goes straight into the detail panel — the next step is
  // always setting their rates and sending the welcome email.
  function handleCreated(rep: NewRep) {
    const created = rep as unknown as Ambassador;
    setAmbassadors((prev) => [created, ...prev]);
    setAdding(false);
    setSelected(created);
    setSheetOpen(true);
  }

  // Lock body scroll when sheet is open on mobile
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  const filtered = useMemo(() => {
    let list = ambassadors;
    if (filter === 'approved') list = list.filter((a) => a.approved);
    else if (filter === 'pending') list = list.filter((a) => !a.approved && a.status !== 'rejected');
    else if (filter === 'rejected') list = list.filter((a) => a.status === 'rejected');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.instagram ?? '').toLowerCase().includes(q) ||
          (a.town ?? '').toLowerCase().includes(q) ||
          (a.discount_code ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [ambassadors, filter, search]);

  const stats = useMemo(() => ({
    total: ambassadors.length,
    approved: ambassadors.filter((a) => a.approved).length,
    pending: ambassadors.filter((a) => !a.approved && a.status !== 'rejected').length,
    rejected: ambassadors.filter((a) => a.status === 'rejected').length,
  }), [ambassadors]);

  function handleSelect(app: Ambassador) {
    setSelected(app);
    setSheetOpen(true);
  }

  function handleUpdate(id: string, fields: Partial<Ambassador>) {
    setAmbassadors((prev) => prev.map((a) => (a.id === id ? { ...a, ...fields } : a)));
    setSelected((prev) => (prev?.id === id ? { ...prev, ...fields } : prev));
  }

  function handleDelete(id: string) {
    setAmbassadors((prev) => prev.filter((a) => a.id !== id));
    setSelected(null);
    setSheetOpen(false);
  }

  function closeSheet() {
    setSheetOpen(false);
  }

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'approved', label: 'Approved', count: stats.approved },
    { key: 'rejected', label: 'Rejected', count: stats.rejected },
  ];

  const title = brand === 'townies' ? 'Town Reps' : brand === 'goodkicks' ? 'Ambassadors' : 'Reps';

  return (
    <>
      <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] overflow-hidden gap-0">
        {/* Left — list */}
        <div className="flex flex-col w-full lg:w-3/5 shrink-0 overflow-hidden">
          <div className="px-4 sm:px-6 pt-5 pb-3 shrink-0 flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl text-white mb-0.5">{title}</h1>
              <p className="text-white/40 text-xs">{stats.total} total · {stats.pending} pending</p>
            </div>
            <button
              onClick={() => { setAdding(true); setSelected(null); setSheetOpen(true); }}
              className="shrink-0 bg-white text-[#1A1A1A] rounded-lg px-3 py-2 text-xs font-medium hover:bg-white/90 transition-colors"
            >
              + Add rep
            </button>
          </div>

          <div className="px-4 sm:px-6 shrink-0">
            <RepTabs active="roster" />
          </div>

          <div className="px-4 sm:px-6 pb-3 shrink-0">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search name, email, instagram, town, code…"
              className="w-full bg-white/8 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="px-4 sm:px-6 pb-3 flex gap-1.5 shrink-0 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  filter === tab.key
                    ? 'bg-white text-brand-ink'
                    : 'bg-white/8 text-white/50 hover:text-white hover:bg-white/12'
                }`}
              >
                {tab.label} <span className="opacity-60">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-2">
            {filtered.length === 0 ? (
              <p className="text-white/30 text-sm pt-6 text-center">no results</p>
            ) : (
              filtered.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleSelect(app)}
                  className={`w-full text-left bg-white rounded-xl border px-4 py-3.5 transition-all active:scale-[0.99] ${
                    selected?.id === app.id
                      ? 'border-brand-rust shadow-sm'
                      : 'border-brand-rule hover:border-brand-rust/40 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-brand-ink text-sm truncate">{app.name}</p>
                      <p className="text-brand-muted text-xs mt-0.5 truncate">
                        {app.instagram} · {(repBrand(app) === 'townies' ? app.town : app.school) ?? app.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {brand === 'all' && <BrandBadge brand={repBrand(app)} />}
                      {app.discount_code && (
                        <span className="font-mono text-[10px] bg-brand-rule px-1.5 py-0.5 rounded text-brand-muted hidden sm:block">
                          {app.discount_code}
                        </span>
                      )}
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        app.approved ? 'bg-green-500' : app.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'
                      }`} />
                      <svg className="lg:hidden text-brand-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right panel — desktop only */}
        <div className="hidden lg:flex lg:w-2/5 shrink-0 overflow-hidden border-l border-white/10">
          <div className="flex-1 bg-white rounded-xl m-4 overflow-y-auto shadow-sm">
            {adding ? (
              <AddRepForm brand={brand} onCreated={handleCreated} onClose={() => setAdding(false)} />
            ) : selected ? (
              <RightPanel key={selected.id} app={selected} discounts={discounts} onUpdate={handleUpdate} onDelete={handleDelete} />
            ) : (
              <EmptyPanel stats={stats} />
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {sheetOpen && (selected || adding) && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => { setAdding(false); closeSheet(); }}
          />
          {/* Sheet */}
          <div
            ref={sheetRef}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl"
            style={{ maxHeight: '90dvh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-brand-rule rounded-full" />
            </div>
            <div className="flex-1 overflow-y-auto">
              {adding ? (
                <AddRepForm
                  brand={brand}
                  onCreated={handleCreated}
                  onClose={() => { setAdding(false); closeSheet(); }}
                />
              ) : selected ? (
                <RightPanel
                  key={selected.id}
                  app={selected}
                  discounts={discounts}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onClose={closeSheet}
                />
              ) : null}
            </div>
          </div>
        </>
      )}
    </>
  );
}
