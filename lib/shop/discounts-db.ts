import 'server-only';
import { db } from './db';
import { normalizeCode, type Discount } from './discounts';

export async function findDiscount(code: string): Promise<Discount | null> {
  const c = normalizeCode(code);
  if (!c || c.length > 40) return null;
  const { data } = await db().from('shop_discounts').select('*').ilike('code', c).maybeSingle();
  return (data as Discount | null) ?? null;
}

export async function markDiscountUsed(code: string) {
  const { error } = await db().rpc('shop_use_discount', { p_code: normalizeCode(code) });
  if (error) console.error('[shop] discount count', error.message);
}
