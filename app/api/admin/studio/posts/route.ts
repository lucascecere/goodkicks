// Content Studio — saved posts: list and create.

import type { NextRequest } from 'next/server';
import { isStudioAdmin, unauthorized } from '@/lib/studio/admin-auth';
import { createPost, listPosts } from '@/lib/studio/posts';
import { getTemplate } from '@/lib/studio/registry';
import { parseProps } from '@/lib/studio/params';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isStudioAdmin())) return unauthorized();
  try {
    return Response.json({ posts: await listPosts() });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Could not load posts' },
      { status: 500 }
    );
  }
}

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

  // Props go through the template's own schema before they're stored, so a
  // malformed save can never poison a later render.
  const props = parseProps(template, (body.props ?? {}) as Record<string, unknown>);

  try {
    const post = await createPost({
      template_id: template.id,
      title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : template.name,
      status: body.status,
      scheduled_for: body.scheduledFor ?? null,
      props: props as Record<string, unknown>,
      caption: typeof body.caption === 'string' ? body.caption : (template.caption?.(props) ?? ''),
    });
    return Response.json({ post });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Could not save post' },
      { status: 500 }
    );
  }
}
