import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { OnboardingPanel } from './onboarding-panel';
import { AccountDetailsEditor } from './account-details-editor';
import { fmtDateLong } from '@/lib/admin/format';
import { ACCOUNT_TYPE_LABELS, FOLLOWER_LABELS } from '@/lib/reps/labels';
import { Badge, PageHeader, type BadgeTone } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="admin-eyebrow">{label}</p>
      <p className="text-sm text-town-cream">{value}</p>
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

  const statusBadge: { label: string; tone: BadgeTone } = app.approved
    ? { label: 'approved', tone: 'good' }
    : app.status === 'rejected'
    ? { label: 'rejected', tone: 'bad' }
    : { label: 'pending review', tone: 'warn' };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        back={{ href: '/admin/ambassadors', label: 'ambassadors' }}
        eyebrow="Rep"
        title={app.name}
        description={
          <a href={`mailto:${app.email}`} className="break-all transition-colors hover:text-town-cream">
            {app.email}
          </a>
        }
        right={<Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account details */}
        <div className="min-w-0 space-y-5 rounded-xl border border-town-cream/10 bg-town-cream/[0.04] p-4 sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 className="admin-eyebrow">Account Details</h2>
            {app.created_at && (
              <p className="text-xs text-town-cream/45">Applied {fmtDateLong(app.created_at)}</p>
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
