import type { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts } from '@/lib/blog/posts';
import { InstagramFeed } from '@/components/home/instagram-feed';

export const metadata: Metadata = {
  title: 'The Stitch — Hacky Sack Tips, Guides & Culture',
  description:
    'Guides, buying advice, and culture pieces about hacky sack and foot bags. Learn how to play, what to buy, and why the circle is worth keeping going.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'The Stitch — Good Kicks Blog',
    description: 'Guides, buying advice, and culture pieces about hacky sack and foot bags.',
    url: '/blog',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
};

export default function BlogPage() {
  const sorted = [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <>
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-16 sm:py-24">
        <h1 className="font-display text-4xl sm:text-5xl text-brand-ink mb-4">
          the circle, in words.
        </h1>
        <p className="text-brand-muted mb-16">
          Guides, stories, and the case for keeping foot bags alive.
        </p>
        <div className="space-y-12">
          {sorted.map((post) => (
            <article key={post.slug} className="border-b border-brand-rule pb-12">
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.map((tag: string) => (
                  <span key={tag} className="text-xs uppercase tracking-wide text-brand-rust font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h2 className="font-display text-2xl sm:text-3xl text-brand-ink hover:text-brand-rust transition-colors mb-3">
                  {post.title}
                </h2>
              </Link>
              <p className="text-brand-muted mb-4">{post.description}</p>
              <div className="flex items-center gap-4 text-sm text-brand-muted">
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </time>
                <span>·</span>
                <span>{post.readTime} min read</span>
              </div>
            </article>
          ))}
        </div>
      </div>
      <InstagramFeed />
    </>
  );
}
