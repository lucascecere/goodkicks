import { createSupabaseServiceClient } from '@/lib/supabase/client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StatCard({ label, value, sub, href }: { label: string; value: number; sub: string; href?: string }) {
  const inner = (
    <div className="bg-white/8 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
      <p className="text-xs text-white/40 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-4xl font-bold text-white mb-1">{value}</p>
      <p className="text-white/40 text-xs leading-relaxed">{sub}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminDashboardPage() {
  const supabase = createSupabaseServiceClient();

  const [{ data: apps }, { data: contacts }] = await Promise.all([
    supabase
      .from('ambassador_applications')
      .select('id, name, email, instagram, status, approved, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('contact_submissions')
      .select('id, name, email, type, message, created_at')
      .order('created_at', { ascending: false }),
  ]);

  const allApps = apps ?? [];
  const allContacts = contacts ?? [];

  const pending = allApps.filter((a) => !a.approved && a.status !== 'rejected').length;
  const approved = allApps.filter((a) => a.approved).length;

  const recentApps = allApps.slice(0, 5);
  const recentContacts = allContacts.slice(0, 5);

  const externalLinks = [
    {
      label: 'Shopify',
      desc: 'orders · products · discounts',
      href: 'https://admin.shopify.com/store/good-kicks-foot-bags-2',
    },
    {
      label: 'Google Analytics',
      desc: 'traffic · sessions · conversions',
      href: 'https://analytics.google.com',
    },
    {
      label: 'Vercel',
      desc: 'deployments · web vitals',
      href: 'https://vercel.com/your-website-friend/goodkicks',
    },
    {
      label: 'Resend',
      desc: 'email delivery logs',
      href: 'https://resend.com',
    },
  ];

  return (
    <div className="p-8 max-w-5xl space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">good kicks admin overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Applications"
          value={allApps.length}
          sub={`${pending} pending`}
          href="/admin/ambassadors"
        />
        <StatCard
          label="Approved"
          value={approved}
          sub="active ambassadors"
          href="/admin/ambassadors"
        />
        <StatCard
          label="Pending Review"
          value={pending}
          sub={pending > 0 ? 'needs action' : 'all clear'}
          href="/admin/ambassadors"
        />
        <StatCard
          label="Contacts"
          value={allContacts.length}
          sub="form submissions"
          href="/admin/contacts"
        />
      </div>

      {/* Ambassadors + Contacts panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent ambassadors */}
        <div className="bg-white rounded-xl border border-brand-rule overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-rule flex items-center justify-between">
            <h2 className="text-sm font-medium text-brand-ink uppercase tracking-wide">Ambassadors</h2>
            <Link href="/admin/ambassadors" className="text-xs text-brand-rust hover:underline">view all →</Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="px-5 py-8 text-brand-muted text-sm text-center">no applications yet.</p>
          ) : (
            <div className="divide-y divide-brand-rule">
              {recentApps.map((a) => {
                const badge = a.approved
                  ? { label: 'approved', cls: 'bg-green-100 text-green-700' }
                  : a.status === 'rejected'
                  ? { label: 'rejected', cls: 'bg-red-100 text-red-600' }
                  : { label: 'pending', cls: 'bg-amber-100 text-amber-700' };
                return (
                  <Link
                    key={a.id}
                    href={`/admin/ambassadors/${a.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[#FAF7F2] transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-ink group-hover:text-brand-rust transition-colors">{a.name}</p>
                      <p className="text-xs text-brand-muted">{a.instagram}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                      <span className="text-xs text-brand-muted">{fmtDate(a.created_at)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent contacts */}
        <div className="bg-white rounded-xl border border-brand-rule overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-rule flex items-center justify-between">
            <h2 className="text-sm font-medium text-brand-ink uppercase tracking-wide">Contacts</h2>
            <Link href="/admin/contacts" className="text-xs text-brand-rust hover:underline">view all →</Link>
          </div>
          {recentContacts.length === 0 ? (
            <p className="px-5 py-8 text-brand-muted text-sm text-center">no submissions yet.</p>
          ) : (
            <div className="divide-y divide-brand-rule">
              {recentContacts.map((c) => (
                <Link
                  key={c.id}
                  href="/admin/contacts"
                  className="flex items-start justify-between px-5 py-3.5 hover:bg-[#FAF7F2] transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-ink group-hover:text-brand-rust transition-colors">{c.name}</p>
                    <p className="text-xs text-brand-muted truncate max-w-xs">
                      {c.message ? c.message.slice(0, 55) + (c.message.length > 55 ? '…' : '') : c.email}
                    </p>
                  </div>
                  <span className="text-xs text-brand-muted ml-3 shrink-0">{fmtDate(c.created_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* External links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {externalLinks.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3.5 transition-colors group"
          >
            <div>
              <p className="text-white text-sm font-medium">{l.label}</p>
              <p className="text-white/40 text-xs mt-0.5">{l.desc}</p>
            </div>
            <span className="text-white/30 group-hover:text-white/70 transition-colors text-sm">→</span>
          </a>
        ))}
      </div>
    </div>
  );
}
