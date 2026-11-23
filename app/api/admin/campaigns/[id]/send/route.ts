import { NextRequest } from 'next/server';
import { isAdminSession } from '@/lib/admin/require-admin';
import { sendCampaign } from '@/lib/email/send-campaign';

// The send itself (recipients, buyer check, From address, unsubscribe, the
// draft -> sending claim) lives in lib/email/send-campaign.ts, shared with the
// scheduled-send cron.

export const maxDuration = 300;

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  if (!(await isAdminSession())) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  // ?test=<email> sends this campaign to that one address only: nothing is
  // recorded and the campaign stays a draft.
  const testTo = req.nextUrl.searchParams.get('test')?.trim().toLowerCase() || null;
  if (testTo && !/^[^\s@]+@[^\s@,]+\.[a-z]{2,}$/i.test(testTo)) {
    return Response.json({ error: 'That test address does not look right.' }, { status: 400 });
  }

  const result = await sendCampaign(id, { testTo });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json(result.test ? { sent: result.sent, failed: result.failed, test: true } : { sent: result.sent, failed: result.failed });
}
