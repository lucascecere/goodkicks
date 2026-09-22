import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { getAdminBrand } from '@/lib/admin/brand-server';
import { ReviewsClient, type AdminReview } from './reviews-client';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const brand = await getAdminBrand();
  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from('reviews')
    .select('*')
    // Pending first — the queue is the job; approved and rejected are history.
    .order('status', { ascending: true })
    .order('created_at', { ascending: false });

  if (brand !== 'all') query = query.eq('brand', brand);

  const { data } = await query;
  return <ReviewsClient initial={(data ?? []) as AdminReview[]} />;
}
