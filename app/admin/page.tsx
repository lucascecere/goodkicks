import { createSupabaseServiceClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const supabase = createSupabaseServiceClient();

  const [{ data: apps }, { data: contacts }] = await Promise.all([
    supabase.from('ambassador_applications').select('id, status, approved, created_at'),
    supabase.from('contact_submissions').select('id, type, created_at'),
  ]);

  const allApps = apps ?? [];
  const allContacts = contacts ?? [];

  const pending = allApps.filter((a) => !a.status || a.status === 'pending').length;
  const approved = allApps.filter((a) => a.status === 'approved' || a.approved).length;
  const rejected = allApps.filter((a) => a.status === 'rejected').length;

  const stats = [
    { label: 'Ambassador Applications', value: allApps.length, sub: `${pending} pending · ${approved} approved · ${rejected} rejected` },
    { label: 'Contact Submissions', value: allContacts.length, sub: `${allContacts.filter((c) => c.type === 'partnership').length} partnership · ${allContacts.filter((c) => c.type === 'general').length} general` },
  ];

  const links = [
    { label: 'Shopify Admin', href: 'https://admin.shopify.com/store/good-kicks-foot-bags-2', desc: 'orders, products, discounts' },
    { label: 'Google Analytics', href: 'https://analytics.google.com', desc: 'traffic, sessions, conversions' },
    { label: 'Vercel Analytics', href: 'https://vercel.com/your-website-friend/goodkicks/analytics', desc: 'web vitals, page views' },
    { label: 'Resend', href: 'https://resend.com', desc: 'email delivery logs' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-white/50 text-sm mt-1">site activity overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-white/10 rounded-xl p-6 border border-white/10">
            <p className="text-xs text-white/50 uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-4xl font-bold text-white mb-1">{s.value}</p>
            <p className="text-white/40 text-xs">{s.sub}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">External Dashboards</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-5 py-4 transition-colors group"
          >
            <div>
              <p className="text-white font-medium text-sm">{l.label}</p>
              <p className="text-white/40 text-xs mt-0.5">{l.desc}</p>
            </div>
            <span className="text-white/30 group-hover:text-white/60 transition-colors">→</span>
          </a>
        ))}
      </div>
    </div>
  );
}
