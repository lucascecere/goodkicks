// Content Studio — one saved post: read, update, delete.

import type { NextRequest } from 'next/server';
import { isStudioAdmin, unauthorized } from '@/lib/studio/admin-auth';
import { deletePost, getPost, updatePost, type PostInput } from '@/lib/studio/posts';
import { getTemplate } from '@/lib/studio/registry';
import { parseProps } from '@/lib/studio/params';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isStudioAdmin())) return unauthorized();
  const { id } = await params;
  try {
    const post = await getPost(id);
    if (!post) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ post });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Could not load post' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isStudioAdmin())) return unauthorized();
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }

  const patch: Partial<PostInput> = {};
  if (typeof body.title === 'string') patch.title = body.title;
  if (typeof body.caption === 'string') patch.caption = body.caption;
  if (body.status !== undefined) patch.status = body.status;
  // `null` is meaningful here — it unschedules. Only `undefined` means "leave
  // it alone", which is why this checks for the key rather than truthiness.
  if (body.scheduledFor !== undefined) patch.scheduled_for = body.scheduledFor;

  // Marking posted stamps the time; un-marking clears it, so a mis-click is
  // fully reversible rather than leaving a stale timestamp behind.
  if (body.status === 'posted') patch.posted_at = new Date().toISOString();
  else if (body.status !== undefined) patch.posted_at = null;

  if (body.props !== undefined) {
    const existing = await getPost(id);
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });
    const template = getTemplate(existing.template_id);
    if (!template) {
      return Response.json({ error: `Unknown template: ${existing.template_id}` }, { status: 400 });
    }
    patch.props = parseProps(template, body.props as Record<string, unknown>) as Record<
      string,
      unknown
    >;
  }

  try {
    return Response.json({ post: await updatePost(id, patch) });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Could not update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isStudioAdmin())) return unauthorized();
  const { id } = await params;
  try {
    await deletePost(id);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Could not delete post' },
      { status: 500 }
    );
  }
}
