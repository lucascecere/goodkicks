import { createSupabaseServiceClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type Contact = {
  id: string;
  created_at: string;
  source: string;
  name: string;
  email: string;
  detail: string;
};

export default async function AdminContactsPage() {
  const supabase = createSupabaseServiceClient();

  const [{ data: apps }, { data: contacts }] = await Promise.all([
    supabase.from('ambassador_applications').select('id, created_at, name, email, instagram, school, status, approved').order('created_at', { ascending: false }),
    supabase.from('contact_submissions').select('id, created_at, name, email, type, message, group_name').order('created_at', { ascending: false }),
  ]);

  const rows: Contact[] = [
    ...(apps ?? []).map((a) => ({
      id: `amb-${a.id}`,
      created_at: a.created_at,
      source: 'ambassador',
      name: a.name,
      email: a.email,
      detail: `${a.instagram} · ${a.school}`,
    })),
    ...(contacts ?? []).map((c) => ({
      id: `con-${c.id}`,
      created_at: c.created_at,
      source: c.type === 'partnership' ? 'partnership' : 'contact',
      name: c.name,
      email: c.email,
      detail: c.message?.slice(0, 60) + (c.message?.length > 60 ? '…' : '') ?? '',
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const sourceBadge: Record<string, string> = {
    ambassador: 'bg-amber-100 text-amber-700',
    partnership: 'bg-blue-100 text-blue-700',
    contact: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Contacts</h1>
        <p className="text-white/50 text-sm mt-1">{rows.length} total across all sources</p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">no contacts yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Source</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Detail</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400 whitespace-nowrap text-xs">{fmtDate(r.created_at)}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sourceBadge[r.source] ?? 'bg-gray-100 text-gray-500'}`}>
                        {r.source}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">{r.name}</td>
                    <td className="px-5 py-4">
                      <a href={`mailto:${r.email}`} className="text-blue-500 hover:underline">{r.email}</a>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs max-w-xs truncate">{r.detail}</td>
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
