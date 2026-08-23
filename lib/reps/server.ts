import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { sendWelcomeEmail } from '@/lib/email/send-welcome';
import { sendRepWelcomeEmail } from '@/lib/email/send-rep-welcome';
import type { RealBrand } from '@/lib/admin/brand';
import { greetingName } from './naming';

export type RepRecord = {
  id: string;
  name: string;
  email: string;
  instagram: string | null;
  brand: RealBrand;
  town: string | null;
  school: string | null;
  hat_preference: string | null;
  colorway_preference: string | null;
  discount_code: string | null;
  discount_pct: number | null;
  commission_pct: number | null;
  tier_pct: number | null;
  shopify_discount_gid: string | null;
  hat_delivered: boolean | null;
  age: number | null;
};

const REP_COLUMNS =
  'id, name, email, instagram, brand, town, school, hat_preference, colorway_preference, discount_code, discount_pct, commission_pct, tier_pct, shopify_discount_gid, hat_delivered, age';

export async function loadRep(id: string): Promise<RepRecord | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('ambassador_applications')
    .select(REP_COLUMNS)
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    ...(data as unknown as RepRecord),
    brand: data.brand === 'townies' ? 'townies' : 'goodkicks',
  };
}

/**
 * What a rep's code is built from. Their identity, not their location: a code
 * is about who they are, and a page run by two people covering two towns has no
 * single town to name.
 */
export function repCodeLabel(rep: RepRecord): string {
  return rep.instagram || rep.name;
}

/**
 * Send the welcome email in the voice of the rep's brand. Townies reps get a
 * flat-rate template; Good Kicks ambassadors keep their tier-ladder template.
 */
export async function sendWelcomeForRep(
  rep: RepRecord,
  {
    discountCode,
    discountPct,
    commissionPct,
  }: { discountCode: string; discountPct: number; commissionPct: number },
): Promise<string> {
  const firstName = greetingName(rep.name);
  const isMinor = typeof rep.age === 'number' && rep.age < 18;

  if (rep.brand === 'townies') {
    return sendRepWelcomeEmail({
      email: rep.email,
      firstName,
      town: rep.town ?? '',
      discountCode,
      discountPct,
      commissionPct,
      isMinor,
      hatDelivered: Boolean(rep.hat_delivered),
    });
  }

  return sendWelcomeEmail({
    firstName,
    email: rep.email,
    discountCode,
    colorway: rep.colorway_preference ?? 'your choice',
    commissionPct,
    discountPct,
    isMinor,
  });
}
