import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe';
import { shopifyAdminGraphQL } from '@/lib/shopify/admin-graphql';

// GET = the footer link (lands on /unsubscribed). POST = Gmail/Apple's
// one-click List-Unsubscribe-Post, which expects a bare 200.

async function unsubscribe(email: string) {
  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();
  const { data } = await supabase.from('contacts').update({ unsubscribed_at: now }).eq('email', email).select('id');
  if (!data?.length) {
    await supabase.from('contacts').insert({ email, sources: [], brands: [], unsubscribed_at: now });
  }
  // Keep Shopify in step so its own marketing mail respects it too.
  try {
    const found = await shopifyAdminGraphQL<{ customers: { nodes: Array<{ id: string }> } }>(
      'query($q: String!) { customers(first: 1, query: $q) { nodes { id } } }',
      { q: `email:${JSON.stringify(email)}` },
    );
    const id = found.customers.nodes[0]?.id;
    if (id) {
      await shopifyAdminGraphQL(
        'mutation($input: CustomerEmailMarketingConsentUpdateInput!) { customerEmailMarketingConsentUpdate(input: $input) { userErrors { message } } }',
        { input: { customerId: id, emailMarketingConsent: { marketingState: 'UNSUBSCRIBED', consentUpdatedAt: now } } },
      );
    }
  } catch (err) {
    console.error('[unsubscribe] shopify consent update failed:', err);
  }
}

function parse(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get('e') ?? '').toLowerCase().trim();
  const token = req.nextUrl.searchParams.get('t') ?? '';
  return email && token && verifyUnsubscribeToken(email, token) ? email : null;
}

export async function GET(req: NextRequest) {
  const email = parse(req);
  if (!email) return NextResponse.redirect(new URL('/unsubscribed?bad=1', req.url));
  await unsubscribe(email);
  return NextResponse.redirect(new URL('/unsubscribed', req.url));
}

export async function POST(req: NextRequest) {
  const email = parse(req);
  if (!email) return new Response('bad link', { status: 400 });
  await unsubscribe(email);
  return new Response('ok');
}
