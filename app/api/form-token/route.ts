import { issueFormToken } from '@/lib/form-guard';

// Every public form fetches one of these when it mounts and posts it back.
// The signed timestamp proves the page was loaded in a browser before the
// form was sent (see lib/form-guard.ts). A post without one is a bot.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ token: issueFormToken() }, { headers: { 'Cache-Control': 'no-store' } });
}
