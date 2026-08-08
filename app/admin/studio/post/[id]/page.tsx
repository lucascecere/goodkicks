import { notFound } from 'next/navigation';
import { getTemplate } from '@/lib/studio/registry';
import { getPost } from '@/lib/studio/posts';
import { StudioEditor, type ExistingPost, type TemplateMeta } from '@/components/studio/studio-editor';

export const dynamic = 'force-dynamic';

/**
 * Edit a saved post. Same editor as "new from template" — it just starts from
 * the stored row instead of the template's mock, and saves with PATCH.
 */
export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  // A template can be removed or renamed while posts referencing it survive.
  const template = getTemplate(post.template_id);
  if (!template) notFound();

  const meta: TemplateMeta = {
    id: template.id,
    name: template.name,
    description: template.description,
    canvas: template.canvas,
    fields: template.fields,
    mock: template.mock as Record<string, unknown>,
    autofillKind: template.autofillKind,
  };

  const existing: ExistingPost = {
    id: post.id,
    title: post.title,
    caption: post.caption,
    status: post.status,
    scheduledFor: post.scheduled_for,
    props: post.props,
  };

  return <StudioEditor template={meta} post={existing} />;
}
