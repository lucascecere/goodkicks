import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { getAdminBrand } from '@/lib/admin/brand-server';
import { ContactsClient } from './contacts-client';

export const dynamic = 'force-dynamic';

export default async function AdminContactsPage() {
  // Respects the global BrandSwitcher, like every other admin page. This page
  // used to ignore it and carry its own private brand chips instead, so the
  // switcher silently did nothing here.
  const brand = await getAdminBrand();
  const supabase = createSupabaseServiceClient();
  let query = supabase
    .from('contacts')
    .select('id, email, name, notes, sources, brands, created_at')
    .order('created_at', { ascending: false });

  // `contains` is `brands @> '{brand}'`, which uses contacts_brands_idx.
  if (brand !== 'all') query = query.contains('brands', [brand]);

  const { data: contacts, error } = await query;

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

  return <ContactsClient initialContacts={contacts ?? []} brand={brand} />;
}
