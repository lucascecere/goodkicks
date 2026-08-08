import Link from 'next/link';
import { templatesByCategory, listTemplates } from '@/lib/studio/registry';
import { CATEGORY_LABELS } from '@/lib/studio/types';
import { listPosts, type ContentPost } from '@/lib/studio/posts';
import { PostsBoard } from '@/components/studio/posts-board';
import { BatchPanel } from '@/components/studio/batch-panel';

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
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-white">Content Studio</h1>
        <p className="text-white/40 text-sm mt-1">
          Templated graphics for Townies Nation. {total} template{total === 1 ? '' : 's'} ready.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] gap-5 mb-9">
        {postsError ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-red-300 text-sm">
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
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/30 mb-3 pb-2 border-b border-white/10">
              {CATEGORY_LABELS[group.category]}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.templates.map((t) => {
                const { width, height } = t.canvas;
                const shape = width === height ? 'Square' : height > width ? 'Portrait' : 'Landscape';
                return (
                  <Link
                    key={t.id}
                    href={`/admin/studio/new/${t.id}`}
                    className="group bg-white/[0.03] border border-white/10 hover:border-brand-rust/50 rounded-xl p-5 transition-colors"
                  >
                    <p className="text-white font-medium group-hover:text-brand-rust transition-colors">
                      {t.name}
                    </p>
                    <p className="text-white/40 text-xs mt-1.5 leading-relaxed">{t.description}</p>
                    <p className="text-white/25 text-[10px] uppercase tracking-[0.16em] mt-3">
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
