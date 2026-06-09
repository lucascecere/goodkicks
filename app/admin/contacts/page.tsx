import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { ContactsClient } from './contacts-client';

export const dynamic = 'force-dynamic';

export default async function AdminContactsPage() {
  const supabase = createSupabaseServiceClient();
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id, email, name, notes, sources, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-8 max-w-3xl">
        <h1 className="font-display text-3xl text-white mb-4">Contacts</h1>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-300 text-sm">
          Could not load contacts. Supabase may not be connected yet.
        </div>
      </div>
    );
  }

  return <ContactsClient initialContacts={contacts ?? []} />;
}
