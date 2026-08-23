import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { OnboardingPanel } from './onboarding-panel';
import { AccountDetailsEditor } from './account-details-editor';
import { fmtDateLong } from '@/lib/admin/format';
import { ACCOUNT_TYPE_LABELS, FOLLOWER_LABELS } from '@/lib/reps/labels';

export const dynamic = 'force-dynamic';

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-brand-muted uppercase tracking-wide">{label}</p>
      <p className="text-sm text-brand-ink">{value}</p>
    </div>
  );
}

export default async function AmbassadorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient();
  const { data: app } = await supabase
    .from('ambassador_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (!app) notFound();

  const brand: 'townies' | 'goodkicks' = app.brand === 'townies' ? 'townies' : 'goodkicks';

  const statusBadge = app.approved
    ? { label: 'approved', cls: 'bg-green-100 text-green-700' }
    : app.status === 'rejected'
    ? { label: 'rejected', cls: 'bg-red-100 text-red-600' }
    : { label: 'pending review', cls: 'bg-amber-100 text-amber-700' };

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href="/admin/ambassadors"
        className="text-sm text-white/50 hover:text-white mb-6 inline-flex items-center gap-1 transition-colors"
      >
        ← ambassadors
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8 mt-4">
        <div>
          <h1 className="font-display text-3xl text-white">{app.name}</h1>
          <a href={`mailto:${app.email}`} className="text-white/50 text-sm hover:text-white/80 transition-colors">
            {app.email}
          </a>
        </div>
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full self-start ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account details */}
        <div className="bg-white rounded-xl border border-brand-rule p-6 space-y-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-sm font-medium text-brand-ink uppercase tracking-wide">Account Details</h2>
            {app.created_at && (
              <p className="text-xs text-brand-muted">Applied {fmtDateLong(app.created_at)}</p>
            )}
          </div>
          <AccountDetailsEditor
            appId={app.id}
            brand={brand}
            initialData={{
              name: app.name,
              email: app.email,
              instagram: app.instagram,
              school: app.school,
              town: app.town ?? null,
              hat_preference: app.hat_preference ?? null,
              account_type: app.account_type,
              followers: app.followers,
              colorway_preference: app.colorway_preference,
              shipping_address: app.shipping_address,
              notes: app.notes ?? null,
              age: app.age ?? null,
            }}
          />
        </div>

        {/* Onboarding panel */}
        <OnboardingPanel app={{
          id: app.id,
          name: app.name,
          email: app.email,
          instagram: app.instagram,
          brand,
          town: app.town ?? null,
          hat_preference: app.hat_preference ?? null,
          colorway_preference: app.colorway_preference,
          approved: app.approved,
          status: app.status,
          discount_code: app.discount_code,
          discount_pct: app.discount_pct ?? 15,
          commission_pct: app.commission_pct ?? app.tier_pct ?? 10,
          shopify_discount_gid: app.shopify_discount_gid ?? null,
          hat_delivered: Boolean(app.hat_delivered),
          age: app.age ?? null,
          welcome_email_sent_at: app.welcome_email_sent_at ?? null,
        }} />
      </div>
    </div>
  );
}
