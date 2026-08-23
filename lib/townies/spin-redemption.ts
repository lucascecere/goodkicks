import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/client';

// "Did the rotary actually sell anything?"
//
// Without this the spin is a signup counter: X people gave an email. With it,
// spin_claims answers the only question worth asking — how many of those codes
// came back as orders, and what they were worth. Called from the Shopify order
// webhook.
//
// Never throws. A failure here must not make Shopify retry an order that was
// already captured; a missing redeemed_at is a reporting gap, not a lost sale.
export async function markSpinCodeRedeemed(
  codes: string[],
  orderId: string | null,
): Promise<void> {
  if (codes.length === 0 || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;

  try {
    const supabase = createSupabaseServiceClient();
    // Match case-insensitively — Shopify echoes the code as the customer typed
    // it, which is not necessarily how it was minted.
    const { error } = await supabase
      .from('spin_claims')
      .update({ redeemed_at: new Date().toISOString(), redeemed_order_id: orderId })
      .is('redeemed_at', null)
      .in('discount_code', [...new Set(codes.map((c) => c.toUpperCase()))]);

    if (error) console.error('[spin-redemption]', error.message);
  } catch (err) {
    console.error('[spin-redemption] unexpected', err);
  }
}
