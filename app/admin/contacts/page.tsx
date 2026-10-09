import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { getAdminBrand } from '@/lib/admin/brand-server';
import { ContactsClient } from './contacts-client';
import { PageHeader } from '@/components/admin/ui';

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
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        <PageHeader eyebrow="People" title="Contacts" />
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-6 text-sm text-red-300">
          Could not load contacts. Supabase may not be connected yet.
        </div>
      </div>
    );
  }

  return <ContactsClient initialContacts={contacts ?? []} brand={brand} />;
}
