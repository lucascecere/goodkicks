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
import { approveRep, createRepCode } from '@/lib/reps/approve-client';
import { Badge, PageHeader, btn, field } from '@/components/admin/ui';

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
  if (app.approved) return <Badge tone="good">approved</Badge>;
  if (app.status === 'rejected') return <Badge tone="bad">rejected</Badge>;
  return <Badge tone="warn">pending</Badge>;
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="admin-eyebrow mb-1">{label}</p>
      <p className="break-words text-sm text-town-cream">{value}</p>
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
      <label className="mb-1.5 block text-xs text-town-cream/55">
        {label}
        {hint && <span className="text-town-cream/40"> · {hint}</span>}
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
          className={`${field} pr-7`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-town-cream/45">%</span>
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

    const result = await approveRep({
      applicationId: app.id,
      discountCode: approveCode,
      discountPct,
      commissionPct,
      createInShopify,
    });
    setApproving(false);

    if (result.ok) {
      onUpdate(app.id, {
        approved: true,
        status: 'approved',
        discount_code: result.discountCode ?? approveCode.trim().toUpperCase(),
        discount_pct: discountPct,
        commission_pct: commissionPct,
        shopify_discount_gid: result.gid ?? app.shopify_discount_gid,
      });
      return;
    }
    if (result.kind === 'scope') setScopeErr(result.message);
    else setApproveErr(result.message);
  }

  async function handleCreateCodeOnly() {
    setApproving(true);
    setApproveErr('');
    setScopeErr('');
    const result = await createRepCode({
      applicationId: app.id,
      code: approveCode,
      discountPct,
    });
    setApproving(false);

    if (result.ok) {
      setApproveCode(result.discountCode ?? approveCode.trim());
      setCodeTouched(true);
      onUpdate(app.id, {
        discount_code: result.discountCode ?? approveCode.trim(),
        discount_pct: discountPct,
        shopify_discount_gid: result.gid,
      });
    } else if (result.kind === 'scope') {
      setScopeErr(result.message);
    } else {
      setApproveErr(result.message);
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
      <div className="border-b p-4 sm:p-5 border-town-cream/10">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0 flex-1">
            <h2 className="font-block text-2xl font-bold leading-tight text-town-cream">{app.name}</h2>
            <a href={`mailto:${app.email}`} className="block truncate text-xs text-town-cream/55 transition-colors hover:text-town-cream">{app.email}</a>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <BrandBadge brand={brand} />
            <StatusBadge app={app} />
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-town-cream/50 transition-colors hover:text-town-cream lg:hidden"
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
            className="text-xs font-semibold text-town-cream hover:underline"
          >
            {app.instagram} ↗
          </a>
        )}
      </div>

      {/* Rates — the two numbers that drive everything else */}
      <div className="border-b p-4 sm:p-5 border-town-cream/10 space-y-3">
        <p className="admin-eyebrow">Rates</p>
        <div className="grid grid-cols-2 gap-3">
          <PctInput label="Customer discount" hint="off" value={discountPct} onChange={setDiscountPct} />
          <PctInput label="Rep commission" hint="of revenue" value={commissionPct} onChange={setCommissionPct} />
        </div>
        <p className="text-[11px] leading-relaxed text-town-cream/45">
          Followers save {discountPct}% on {isTownies ? 'Townies hats' : 'Good Kicks gear'}; the rep earns{' '}
          {commissionPct}% of what those orders actually bring in. Max {MAX_PCT}% either way.
        </p>
      </div>

      {/* Approve flow */}
      {!app.approved && app.status !== 'rejected' && (
        <div className="border-b p-4 sm:p-5 border-town-cream/10 space-y-3">
          <p className="admin-eyebrow">
            Approve {isTownies ? 'Town Rep' : 'Ambassador'}
          </p>
          <div>
            <label className="mb-1.5 block text-xs text-town-cream/55">Discount code</label>
            <input
              value={approveCode}
              onChange={(e) => { setCodeTouched(true); setApproveCode(e.target.value.toUpperCase()); }}
              placeholder={suggested || 'e.g. SOUTHSHOREGUYS15'}
              className={`${field} font-mono`}
            />
            {suggestions.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => { setCodeTouched(true); setApproveCode(s.code); }}
                    className={`rounded border px-2 py-1 font-mono text-[10px] transition-colors ${
                      approveCode === s.code
                        ? 'border-town-cream bg-town-cream text-town-navy'
                        : 'border-town-cream/15 text-town-cream/55 hover:border-town-cream/50 hover:text-town-cream'
                    }`}
                  >
                    {s.code}
                    <span className="opacity-50"> · {s.label}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="mt-1.5 text-[11px] text-town-cream/45">
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
                className="mt-0.5 shrink-0 accent-town-cream"
              />
              <span className="text-[11px] leading-relaxed text-town-cream">
                They already have their hat
                <span className="text-town-cream/50"> — changes what the welcome email says.</span>
              </span>
            </label>
          )}
          {/* Known up front, so the by-hand route is the primary flow rather
              than something discovered by failing once per rep. */}
          {!discounts.ready && !scopeErr && (
            <div className="space-y-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
              <p className="text-[11px] leading-relaxed text-amber-200">
                {discounts.reason} Create <strong className="font-mono">{approveCode || suggested}</strong> in
                Shopify first, set to <strong>{discountPct}% off</strong> the{' '}
                {isTownies ? 'Townies' : 'Good Kicks'} collection, then approve below.
              </p>
              <a
                href={discounts.discountsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-amber-400/40 px-3 py-2 text-center text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/10"
              >
                open Shopify Discounts ↗
              </a>
            </div>
          )}
          {scopeErr && (
            <div className="space-y-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
              <p className="text-[11px] leading-relaxed text-amber-200">{scopeErr}</p>
              <a
                href={discounts.discountsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-amber-400/40 px-3 py-2 text-center text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/10"
              >
                open Shopify Discounts ↗
              </a>
              <button
                onClick={() => handleApprove(false)}
                disabled={approving || !approveCode.trim()}
                className="w-full rounded-lg border border-amber-400/40 px-3 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/10 disabled:opacity-50"
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
                className="text-xs font-semibold text-town-cream hover:underline"
              >
                {showPreview ? 'hide the email they’ll get ↑' : 'read the email they’ll get ↓'}
              </button>
              {showPreview && (
                <div className="mt-2 rounded-lg border border-town-cream/10 bg-town-navy/60 p-3">
                  <p className="mb-2 break-words text-[10px] uppercase leading-relaxed tracking-wide text-town-cream/45">
                    From: Townies &lt;{TOWNIES_FROM_HINT}&gt;<br />
                    To: {app.email}<br />
                    Subject: {repWelcomeSubject(greetingName(app.name))}
                  </p>
                  <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-town-cream/85">
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
          {approveErr && <p className="text-xs text-red-300">{approveErr}</p>}
          <button
            onClick={() => handleApprove(discounts.ready)}
            disabled={approving || (!discounts.ready && !approveCode.trim())}
            className={`${btn.primary} w-full`}
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
      <div className="space-y-3 border-b p-4 sm:p-5 border-town-cream/10">
        <p className="admin-eyebrow">Profile</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <div className="space-y-2 border-b p-4 sm:p-5 border-town-cream/10">
        <p className="admin-eyebrow">Email</p>
        <div className="flex items-center gap-2">
          <input
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            placeholder="email@example.com"
            className={`${field} min-w-0 flex-1`}
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
            className={`${btn.secondary} shrink-0`}
          >
            save
          </button>
        </div>
      </div>

      {/* Code + rates for approved reps */}
      {app.approved && (
        <div className="space-y-3 border-b p-4 sm:p-5 border-town-cream/10">
          <p className="admin-eyebrow">Discount Code</p>
          <div>
            <input
              value={editCode}
              onChange={(e) => setEditCode(e.target.value.toUpperCase())}
              placeholder="e.g. MILTON15"
              className={`${field} font-mono`}
            />
            <p className="mt-1 text-[11px] text-town-cream/45">
              {app.shopify_discount_gid
                ? 'Linked to Shopify — changing the discount % above updates the live code.'
                : 'Not linked to a Shopify discount yet.'}
            </p>
          </div>
          {!app.shopify_discount_gid && (
            <button
              onClick={handleCreateCodeOnly}
              disabled={approving}
              className={`${btn.secondary} w-full`}
            >
              {approving ? 'creating…' : 'create this code in Shopify'}
            </button>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`${btn.primary} flex-1`}
            >
              {saving ? 'saving…' : 'save code & rates'}
            </button>
            {saveMsg && (
              <span className={`text-xs font-semibold ${saveMsg.startsWith('saved') || saveMsg.includes('sent') ? 'text-emerald-300' : 'text-red-300'}`}>
                {saveMsg}
              </span>
            )}
          </div>
          <button
            onClick={handleResendWelcome}
            disabled={saving}
            className={`${btn.ghost} w-full`}
          >
            resend welcome email
          </button>
          {app.discount_code && (
            <a
              href={`/ambassador/${app.discount_code.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs font-semibold text-town-cream hover:underline"
            >
              view their stats page →
            </a>
          )}
        </div>
      )}

      {/* Status controls */}
      <div className="space-y-3 border-b p-4 sm:p-5 border-town-cream/10">
        <p className="admin-eyebrow">Change Status</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusChange('pending')}
            disabled={!app.approved && app.status !== 'rejected'}
            className="flex-1 rounded-lg border border-amber-400/30 py-2.5 font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300 transition-colors hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            set pending
          </button>
          <button
            onClick={() => handleStatusChange('rejected')}
            disabled={app.status === 'rejected'}
            className="flex-1 rounded-lg border border-red-400/30 py-2.5 font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-red-300 transition-colors hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            reject
          </button>
        </div>
      </div>

      {/* Full detail link + delete */}
      <div className="p-5 space-y-3 mt-auto">
        <Link
          href={`/admin/ambassadors/${app.id}`}
          className={`${btn.secondary} w-full`}
        >
          open full detail page →
        </Link>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="block w-full py-1 text-center text-xs text-red-300/80 transition-colors hover:text-red-300"
          >
            delete rep
          </button>
        ) : (
          <div className="space-y-2 rounded-lg border border-red-400/30 bg-red-400/10 p-3">
            <p className="text-xs font-semibold text-red-200">
              Permanently delete {app.name}? This cannot be undone. Their Shopify discount code is
              not removed — delete it in Shopify too if you want it dead.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'deleting…' : 'yes, delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-lg border border-red-400/30 px-3 py-2 text-xs text-red-300 transition-colors hover:bg-red-400/10"
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
          <div key={s.label} className="rounded-xl border border-town-cream/10 bg-town-cream/[0.04] p-4">
            <p className="font-block text-3xl font-bold leading-none text-town-cream tabular-nums">{s.value}</p>
            <p className="admin-eyebrow mt-2">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm text-town-cream/45">select a rep to manage</p>
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
      <div className="flex h-[calc(100vh-64px)] gap-0 overflow-hidden md:h-screen">
        {/* Left — list */}
        <div className="flex flex-col w-full lg:w-3/5 shrink-0 overflow-hidden">
          <div className="shrink-0 px-4 pt-6 sm:px-8 sm:pt-10">
            <PageHeader
              eyebrow="Reps"
              title={title}
              description={`${stats.total} total · ${stats.pending} pending`}
              right={
                <button
                  onClick={() => { setAdding(true); setSelected(null); setSheetOpen(true); }}
                  className={btn.primary}
                >
                  + Add rep
                </button>
              }
            />
          </div>

          <div className="shrink-0 px-4 sm:px-8">
            <RepTabs active="roster" />
          </div>

          <div className="shrink-0 px-4 pb-3 sm:px-8">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search name, email, instagram, town, code…"
              className={field}
            />
          </div>

          <div className="flex shrink-0 gap-1.5 overflow-x-auto px-4 pb-3 sm:px-8">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`whitespace-nowrap rounded-full px-3.5 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  filter === tab.key
                    ? 'bg-town-cream text-town-navy'
                    : 'border border-town-cream/15 text-town-cream/60 hover:text-town-cream'
                }`}
              >
                {tab.label} <span className="opacity-60">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-6 sm:px-8">
            {filtered.length === 0 ? (
              <p className="pt-6 text-center text-sm text-town-cream/40">no results</p>
            ) : (
              filtered.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleSelect(app)}
                  className={`w-full rounded-xl border px-4 py-3.5 text-left transition-all active:scale-[0.99] ${
                    selected?.id === app.id
                      ? 'border-town-cream/50 bg-town-cream/[0.08]'
                      : 'border-town-cream/10 bg-town-cream/[0.04] hover:border-town-cream/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-town-cream">{app.name}</p>
                      <p className="mt-0.5 truncate text-xs text-town-cream/50">
                        {app.instagram} · {(repBrand(app) === 'townies' ? app.town : app.school) ?? app.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {brand === 'all' && <BrandBadge brand={repBrand(app)} />}
                      {app.discount_code && (
                        <span className="hidden rounded border border-town-cream/15 px-1.5 py-0.5 font-mono text-[10px] text-town-cream/70 sm:block">
                          {app.discount_code}
                        </span>
                      )}
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        app.approved ? 'bg-emerald-400' : app.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'
                      }`} />
                      <svg className="text-town-cream/40 lg:hidden" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <div className="hidden shrink-0 overflow-hidden border-l border-town-cream/10 lg:flex lg:w-2/5">
          <div className="m-4 flex-1 overflow-y-auto rounded-xl border border-town-cream/10 bg-town-cream/[0.04]">
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
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => { setAdding(false); closeSheet(); }}
          />
          {/* Sheet */}
          <div
            ref={sheetRef}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-town-cream/15 bg-[#0A1520] shadow-2xl lg:hidden"
            style={{ maxHeight: '90dvh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-town-cream/20" />
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
