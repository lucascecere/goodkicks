import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { ExpandCard } from './expand-card';

export const dynamic = 'force-dynamic';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function AdminContactsPage() {
  const supabase = createSupabaseServiceClient();

  const { data: contacts } = await supabase
    .from('contact_submissions')
    .select('id, created_at, name, email, message')
    .order('created_at', { ascending: false });

  const all = contacts ?? [];

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white">Contacts</h1>
        <p className="text-white/50 text-sm mt-1">{all.length} form submission{all.length !== 1 ? 's' : ''}</p>
      </div>

      {all.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-rule p-12 text-center text-brand-muted">
          no contact form submissions yet.
        </div>
      ) : (
        <div className="space-y-2">
          {all.map((c) => (
            <ExpandCard
              key={c.id}
              name={c.name}
              email={c.email}
              date={c.created_at ? fmtDate(c.created_at) : '—'}
              message={c.message ?? ''}
            />
          ))}
        </div>
      )}
    </div>
  );
}
