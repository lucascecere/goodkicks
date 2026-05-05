import { createSupabaseServiceClient } from '@/lib/supabase/client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusBadge(app: { approved: boolean; status: string | null }) {
  if (app.approved) return { label: 'approved', cls: 'bg-green-100 text-green-700' };
  if (app.status === 'rejected') return { label: 'rejected', cls: 'bg-red-100 text-red-600' };
  return { label: 'pending', cls: 'bg-amber-100 text-amber-700' };
}

export default async function AdminAmbassadorsPage() {
  const supabase = createSupabaseServiceClient();
  const { data: apps } = await supabase
    .from('ambassador_applications')
    .select('*')
    .order('created_at', { ascending: false });

  const all = apps ?? [];
  const pending = all.filter((a) => !a.approved && a.status !== 'rejected').length;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white">Ambassadors</h1>
        <p className="text-white/50 text-sm mt-1">
          {all.length} total · {pending} pending review
        </p>
      </div>

      {all.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-rule p-12 text-center text-brand-muted">
          no applications yet.
        </div>
      ) : (
        <div className="space-y-2">
          {all.map((app) => {
            const badge = statusBadge(app);
            return (
              <Link
                key={app.id}
                href={`/admin/ambassadors/${app.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-brand-rule px-5 py-4 hover:border-brand-rust/40 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-5 min-w-0">
                  <div className="min-w-0">
                    <p className="font-medium text-brand-ink group-hover:text-brand-rust transition-colors">{app.name}</p>
                    <p className="text-brand-muted text-xs mt-0.5">{app.instagram}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <p className="text-brand-muted text-xs hidden sm:block">
                    {app.created_at ? fmtDate(app.created_at) : '—'}
                  </p>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.cls}`}>
                    {badge.label}
                  </span>
                  <span className="text-brand-muted text-xs group-hover:text-brand-rust transition-colors">view →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
