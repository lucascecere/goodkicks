import Link from 'next/link';
import { templatesByCategory, listTemplates } from '@/lib/studio/registry';
import { CATEGORY_LABELS } from '@/lib/studio/types';
import { listPosts, type ContentPost } from '@/lib/studio/posts';
import { PostsBoard } from '@/components/studio/posts-board';
import { BatchPanel } from '@/components/studio/batch-panel';
import { PageHeader } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

/**
 * The studio hub: what's queued, what the month looks like, and what to build
 * next. The template gallery reads straight off the registry, so a new template
 * file appears here on its own.
 */
export default async function StudioPage() {
  const groups = templatesByCategory();
  const total = listTemplates().length;

  // A studio that 500s because the table is unreachable is worse than one that
  // still lets you build and export.
  let posts: ContentPost[] = [];
  let postsError: string | null = null;
  try {
    posts = await listPosts();
  } catch (err) {
    postsError = err instanceof Error ? err.message : 'Could not load saved posts.';
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Marketing"
        title="Content Studio"
        description={`Templated graphics for Townies Nation. ${total} template${total === 1 ? '' : 's'} ready.`}
      />

      <div className="mb-9 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
        {postsError ? (
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-300">
            {postsError}
          </div>
        ) : (
          <PostsBoard initialPosts={posts} />
        )}
        <BatchPanel />
      </div>

      <div className="space-y-9">
        {groups.map((group) => (
          <div key={group.category}>
            <p className="admin-eyebrow mb-3 border-b border-town-cream/10 pb-2">
              {CATEGORY_LABELS[group.category]}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.templates.map((t) => {
                const { width, height } = t.canvas;
                const shape = width === height ? 'Square' : height > width ? 'Portrait' : 'Landscape';
                return (
                  <Link
                    key={t.id}
                    href={`/admin/studio/new/${t.id}`}
                    className="group rounded-xl border border-town-cream/10 bg-town-cream/[0.04] p-5 transition-colors hover:border-town-cream/30"
                  >
                    <p className="font-block text-lg font-bold text-town-cream transition-colors group-hover:underline">
                      {t.name}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-town-cream/50">{t.description}</p>
                    <p className="mt-3 font-label text-[10px] uppercase tracking-[0.16em] text-town-cream/35">
                      {width}×{height} · {shape}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
