// Content Studio — the render endpoint. Template + values in, PNG out.
//
// One route serves every template; the registry decides what gets drawn and at
// what size. The admin preview points an <img> straight at this URL, so what
// you see while editing IS the export — there is no second rendering path that
// could drift. The bulk ZIP export shares the same renderTemplateToResponse.

import type { NextRequest } from 'next/server';
import { getTemplate } from '@/lib/studio/registry';
import { isStudioAdmin, unauthorized } from '@/lib/studio/admin-auth';
import { coerceToMockTypes, decodeProps, parseProps } from '@/lib/studio/params';
import { getPost } from '@/lib/studio/posts';
import { renderTemplateToResponse } from '@/lib/studio/render';

// Node runtime: the font loader and image pre-resolver both want Buffer, and
// there is no edge-only requirement here worth the constraints.
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ template: string }> }
) {
  if (!(await isStudioAdmin())) return unauthorized();

  const { template: templateId } = await params;
  const template = getTemplate(templateId);
  if (!template) {
    return new Response(`Unknown template: ${templateId}`, { status: 404 });
  }

  const url = new URL(req.url);
  const origin = url.origin;

  // Three input modes:
  //   ?postId= — a saved post, so calendar and queue cards can show real
  //              thumbnails instead of a generic placeholder
  //   ?data=   — a base64url blob for unsaved edits, which keeps long headline
  //              text out of the query string
  //   plain query params — for hand-built URLs and quick testing
  const postId = url.searchParams.get('postId');
  const encoded = url.searchParams.get('data');

  let raw: Record<string, unknown>;
  if (postId) {
    const post = await getPost(postId);
    if (!post) return new Response(`Unknown post: ${postId}`, { status: 404 });
    if (post.template_id !== template.id) {
      return new Response(
        `Post ${postId} belongs to template ${post.template_id}, not ${template.id}`,
        { status: 400 }
      );
    }
    raw = post.props;
  } else if (encoded) {
    raw = decodeProps(encoded) ?? {};
  } else {
    raw = coerceToMockTypes(Object.fromEntries(url.searchParams.entries()), template.mock);
  }

  const props = parseProps(template, raw);

  try {
    return await renderTemplateToResponse(template, props as Record<string, unknown>, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown render error';
    console.error(`[studio] render failed for ${templateId}:`, err);
    return new Response(`Render failed: ${message}`, { status: 500 });
  }
}
