import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { ApproveButton } from './approve-button';

export const dynamic = 'force-dynamic';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const followerLabels: Record<string, string> = {
  'under-500': '< 500',
  '500-2k': '500–2k',
  '2k-10k': '2k–10k',
  '10k+': '10k+',
};

const typeLabels: Record<string, string> = {
  'high-school': 'High School',
  'college': 'College',
  'freestyle': 'Freestyle',
  'general': 'General',
};

export default async function AdminAmbassadorsPage() {
  const supabase = createSupabaseServiceClient();
  const { data: apps } = await supabase
    .from('ambassador_applications')
    .select('*')
    .order('created_at', { ascending: false });

  const all = apps ?? [];
  const pending = all.filter((a) => a.status === 'pending').length;

  return (
    <div className="p-8">
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
        <div className="bg-white rounded-xl border border-brand-rule overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-rule bg-[#FAF7F2]">
                  <th className="text-left px-5 py-3 text-xs font-medium text-brand-muted uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-brand-muted uppercase tracking-wide">Applicant</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-brand-muted uppercase tracking-wide">Instagram</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-brand-muted uppercase tracking-wide">School</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-brand-muted uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-brand-muted uppercase tracking-wide">Followers</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-brand-muted uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {all.map((app) => (
                  <tr key={app.id} className="border-b border-brand-rule/50 hover:bg-[#FAF7F2] transition-colors">
                    <td className="px-5 py-4 text-brand-muted whitespace-nowrap">
                      {app.created_at ? fmtDate(app.created_at) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-brand-ink">{app.name}</p>
                      <a href={`mailto:${app.email}`} className="text-brand-rust text-xs hover:underline">{app.email}</a>
                    </td>
                    <td className="px-5 py-4">
                      <a
                        href={`https://instagram.com/${app.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-rust hover:underline"
                      >
                        {app.instagram}
                      </a>
                    </td>
                    <td className="px-5 py-4 text-brand-ink">{app.school}</td>
                    <td className="px-5 py-4 text-brand-muted">{typeLabels[app.account_type] ?? app.account_type ?? '—'}</td>
                    <td className="px-5 py-4 text-brand-muted">{followerLabels[app.followers] ?? app.followers ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        app.approved ? 'bg-green-100 text-green-700' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {app.approved ? 'approved' : (app.status ?? 'pending')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {!app.approved && (
                        <ApproveButton applicationId={app.id} instagram={app.instagram} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
