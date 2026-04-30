import Link from 'next/link';
import { blogPosts } from '@/lib/blog/posts';

export function StitchPromo() {
  const recent = [...blogPosts]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);

  return (
    <section className="py-20 px-4 sm:px-8 bg-brand-ink text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-3">from the blog</p>
            <h2 className="font-display text-4xl sm:text-5xl text-white">the stitch.</h2>
            <p className="text-white/60 mt-3 max-w-md leading-relaxed">
              guides, culture, and everything happening in the world of foot bags and hacky sacks.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center text-brand-rust hover:text-white transition-colors font-medium whitespace-nowrap"
          >
            read the stitch →
          </Link>
        </div>

        {/* Post cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {recent.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
              <article className="border border-white/10 rounded-lg p-6 hover:border-white/30 transition-colors h-full flex flex-col">
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-xs uppercase tracking-wide text-brand-rust font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="font-display text-xl text-white group-hover:text-white/80 transition-colors mb-3 flex-1">
                  {post.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed line-clamp-2 mb-4">
                  {post.description}
                </p>
                <div className="text-white/30 text-xs">
                  {post.readTime} min read
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
