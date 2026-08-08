// Content Studio — suggested caption for the current values.
//
// A template's `caption` is a function, so it can't cross into the client
// bundle with the rest of the template metadata. This endpoint runs it on the
// server and hands back the string.
//
// The caption is a STARTING POINT: the editor drops it into an editable box and
// only overwrites it while the user hasn't touched it. Regenerating over
// someone's rewritten caption would be the single most annoying thing this
// studio could do.

import type { NextRequest } from 'next/server';
import { isStudioAdmin, unauthorized } from '@/lib/studio/admin-auth';
import { getTemplate } from '@/lib/studio/registry';
import { parseProps } from '@/lib/studio/params';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!(await isStudioAdmin())) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }

  const template = getTemplate(body.templateId);
  if (!template) {
    return Response.json({ error: `Unknown template: ${body.templateId}` }, { status: 400 });
  }

  const props = parseProps(template, (body.props ?? {}) as Record<string, unknown>);
  return Response.json({ caption: template.caption?.(props) ?? '' });
}
