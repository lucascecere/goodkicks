import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { AmbassadorsClient } from './ambassadors-client';

export const dynamic = 'force-dynamic';

export default async function AdminAmbassadorsPage() {
  const supabase = createSupabaseServiceClient();
  const { data: apps } = await supabase
    .from('ambassador_applications')
    .select('*')
    .order('created_at', { ascending: false });

  return <AmbassadorsClient initial={apps ?? []} />;
}
