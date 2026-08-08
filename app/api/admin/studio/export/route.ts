// Content Studio — bulk export.
//
// POST a list of post ids, get back one ZIP: every graphic as a PNG, plus a
// captions.txt. This is the payoff of the batch button — generate a week of
// gameday posts, download once, and you have everything you need to sit down
// and post.
//
// Rendered server-side rather than having the browser fetch each PNG: one
// request instead of N, one file instead of N, and the captions ride along.

import type { NextRequest } from 'next/server';
import { zipSync, strToU8 } from 'fflate';
import { isStudioAdmin, unauthorized } from '@/lib/studio/admin-auth';
import { getPost, type ContentPost } from '@/lib/studio/posts';
import { getTemplate } from '@/lib/studio/registry';
import { parseProps } from '@/lib/studio/params';
import { renderTemplateToPng } from '@/lib/studio/render';
import { dedupeFilenames, postFilename } from '@/lib/studio/filename';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Each render is ~400ms and holds a full bitmap in memory. A cap keeps one
 * click from tying up a serverless function past its timeout — and the
 * response says how many were skipped rather than silently truncating.
 */
const MAX_POSTS = 40;

function captionBlock(post: ContentPost, filename: string): string {
  const when = post.scheduled_for
    ? new Date(post.scheduled_for).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York',
      })
    : 'Unscheduled';

  return [
    '='.repeat(60),
    filename,
    `${post.title || 'Untitled'}  ·  ${when}`,
    '='.repeat(60),
    '',
    post.caption || '(no caption)',
    '',
    '',
  ].join('\n');
}

export async function POST(req: NextRequest) {
  if (!(await isStudioAdmin())) return unauthorized();

  const body = await req.json().catch(() => null);
  const ids: unknown = body?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return Response.json({ error: 'Provide ids: string[]' }, { status: 400 });
  }

  const requested = ids.filter((id): id is string => typeof id === 'string');
  const capped = requested.slice(0, MAX_POSTS);

  const posts: ContentPost[] = [];
  for (const id of capped) {
    const post = await getPost(id);
    // A post deleted between listing and export shouldn't fail the whole ZIP.
    if (post) posts.push(post);
  }

  if (posts.length === 0) {
    return Response.json({ error: 'None of those posts exist' }, { status: 404 });
  }

  const origin = new URL(req.url).origin;
  const names = dedupeFilenames(posts.map((p) => postFilename(p)));

  const files: Record<string, Uint8Array> = {};
  const captions: string[] = [];
  const failed: string[] = [];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const template = getTemplate(post.template_id);
    if (!template) {
      failed.push(`${post.title || post.id} (unknown template ${post.template_id})`);
      continue;
    }

    try {
      const props = parseProps(template, post.props);
      files[names[i]] = await renderTemplateToPng(
        template,
        props as Record<string, unknown>,
        origin
      );
      captions.push(captionBlock(post, names[i]));
    } catch (err) {
      // One bad post must not cost the user the other nineteen.
      console.error(`[studio] export render failed for ${post.id}:`, err);
      failed.push(post.title || post.id);
    }
  }

  if (Object.keys(files).length === 0) {
    return Response.json({ error: 'Every render failed — check the server log' }, { status: 500 });
  }

  const header = [
    'TOWNIES NATION — CONTENT STUDIO EXPORT',
    `${Object.keys(files).length} post${Object.keys(files).length === 1 ? '' : 's'}`,
    failed.length ? `\nCOULD NOT RENDER (${failed.length}): ${failed.join(', ')}` : '',
    '',
    '',
  ].join('\n');

  files['captions.txt'] = strToU8(header + captions.join(''));

  // Level 0 (store): PNGs are already compressed, so deflating them costs CPU
  // for roughly nothing. captions.txt is a rounding error.
  const zip = zipSync(files, { level: 0 });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(zip as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="townies-posts-${stamp}.zip"`,
      'Cache-Control': 'no-store',
      // Surfaced so the UI can tell the user something was skipped rather than
      // letting them discover a short ZIP later.
      'X-Export-Failed': String(failed.length),
      'X-Export-Skipped': String(requested.length - capped.length),
    },
  });
}
