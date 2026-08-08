import { notFound } from 'next/navigation';
import { getTemplate } from '@/lib/studio/registry';
import { StudioEditor, type TemplateMeta } from '@/components/studio/studio-editor';

export const dynamic = 'force-dynamic';

/**
 * Server boundary for the editor.
 *
 * Only the plain-data slice of the template crosses into the client — id, name,
 * canvas, fields, mock. The registry stays server-side because every template
 * module carries a Satori render function and its JSX; shipping that to the
 * browser would bloat the bundle with code that can never run there.
 */
export default async function NewFromTemplatePage({
  params,
}: {
  params: Promise<{ template: string }>;
}) {
  const { template: id } = await params;
  const template = getTemplate(id);
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

  return <StudioEditor template={meta} />;
}
