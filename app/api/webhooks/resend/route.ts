import { NextRequest } from 'next/server';
import { Webhook } from 'svix';
import { createSupabaseServiceClient } from '@/lib/supabase/client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return new Response('Webhook secret not configured', { status: 500 });

  const body = await req.text();
  const headers = {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  };

  let event: { type: string; data: { email_id: string } };
  try {
    const wh = new Webhook(secret);
    event = wh.verify(body, headers) as typeof event;
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const emailId = event.data.email_id;
  const now = new Date().toISOString();

  if (event.type === 'email.delivered') {
    await supabase.from('campaign_sends')
      .update({ status: 'delivered', delivered_at: now })
      .eq('resend_id', emailId)
      .in('status', ['sent']);
  } else if (event.type === 'email.opened') {
    await supabase.from('campaign_sends')
      .update({ status: 'opened', opened_at: now })
      .eq('resend_id', emailId)
      .in('status', ['sent', 'delivered']);
  } else if (event.type === 'email.bounced') {
    await supabase.from('campaign_sends')
      .update({ status: 'bounced', bounced_at: now })
      .eq('resend_id', emailId);
  } else if (event.type === 'email.complained') {
    await supabase.from('campaign_sends')
      .update({ status: 'complained', complained_at: now })
      .eq('resend_id', emailId);
  }

  return Response.json({ received: true });
}
