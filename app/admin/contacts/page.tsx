import { createSupabaseServiceClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ExpandCard } from './expand-card';

export const dynamic = 'force-dynamic';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const sourceBadge: Record<string, string> = {
  contact: 'bg-gray-100 text-gray-600',
  ambassador: 'bg-amber-100 text-amber-700',
};

export default async function AdminContactsPage() {
  const supabase = createSupabaseServiceClient();

  const [{ data: contacts }, { data: apps }] = await Promise.all([
    supabase
      .from('contact_submissions')
      .select('id, created_at, name, email, message')
      .order('created_at', { ascending: false }),
    supabase
      .from('ambassador_applications')
      .select('id, created_at, name, email, instagram, school, status, approved')
      .order('created_at', { ascending: false }),
  ]);

  const contactRows = (contacts ?? []).map((c) => ({
    key: `con-${c.id}`,
    source: 'contact' as const,
    created_at: c.created_at,
    name: c.name,
    email: c.email,
    detail: c.message ?? '',
    href: null as string | null,
    ambId: null as string | null,
    ambStatus: null as string | null,
  }));

  const ambRows = (apps ?? []).map((a) => ({
    key: `amb-${a.id}`,
    source: 'ambassador' as const,
    created_at: a.created_at,
    name: a.name,
    email: a.email,
    detail: [a.instagram, a.school].filter(Boolean).join(' · '),
    href: `/admin/ambassadors/${a.id}`,
    ambId: a.id,
    ambStatus: a.approved ? 'approved' : (a.status ?? 'pending'),
  }));

  const all = [...contactRows, ...ambRows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const total = all.length;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white">Contacts</h1>
        <p className="text-white/50 text-sm mt-1">
          {total} total · {contactRows.length} contact form · {ambRows.length} ambassador
        </p>
      </div>

      {/* Newsletter note */}
      <a
        href="https://admin.shopify.com/store/good-kicks-foot-bags-2/customers?filters[accepts_marketing]=true"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 mb-6 hover:bg-white/10 transition-colors group"
      >
        <div>
          <p className="text-white text-sm font-medium">Newsletter subscribers</p>
          <p className="text-white/40 text-xs mt-0.5">managed in Shopify Customers → accepts marketing</p>
        </div>
        <span className="text-white/30 group-hover:text-white/60 transition-colors text-sm">→</span>
      </a>

      {all.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-rule p-12 text-center text-brand-muted">
          no contacts yet.
        </div>
      ) : (
        <div className="space-y-2">
          {all.map((row) => {
            if (row.source === 'ambassador') {
              const statusCls =
                row.ambStatus === 'approved' ? 'bg-green-100 text-green-700'
                : row.ambStatus === 'rejected' ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-700';
              return (
                <Link
                  key={row.key}
                  href={row.href!}
                  className="flex items-center justify-between bg-white rounded-xl border border-brand-rule px-5 py-4 hover:border-brand-rust/30 transition-all group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-brand-ink group-hover:text-brand-rust transition-colors">{row.name}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${sourceBadge.ambassador}`}>ambassador</span>
                    </div>
                    <p className="text-brand-muted text-xs mt-0.5">{row.detail}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCls}`}>{row.ambStatus}</span>
                    <span className="text-xs text-brand-muted">{fmtDate(row.created_at)}</span>
                  </div>
                </Link>
              );
            }

            return (
              <ExpandCard
                key={row.key}
                name={row.name}
                email={row.email}
                date={fmtDate(row.created_at)}
                message={row.detail}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
