import type { Metadata } from 'next';
import Link from 'next/link';
import { towniePosts } from '@/lib/townies/blog-posts';
import { BrandPattern } from '@/components/townies/brand-pattern';

export const metadata: Metadata = {
  title: 'The Town Paper — Massachusetts Town Pride, Stories & Culture',
  description:
    'Stories, town guides, and the case for repping where you’re from. Massachusetts town-pride culture from Townies Apparel Co.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'The Town Paper — Townies Blog',
    description: 'Massachusetts town-pride stories, guides, and culture from Townies Apparel Co.',
    url: '/blog',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Town Paper — Townies Blog',
    description: 'Massachusetts town-pride stories, guides, and culture.',
    images: ['/opengraph-image.png'],
  },
};

export default function BlogPage() {
  const sorted = [...towniePosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return (
    <div className="relative overflow-hidden bg-town-cream min-h-screen">
      <BrandPattern variant="ma" color="forest" opacity={0.05} size={220} fade="b" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium mb-3">
          The Town Paper
        </p>
        <h1 className="font-block uppercase text-4xl sm:text-6xl text-town-navy leading-[0.95] mb-4">
          Stories from the towns.
        </h1>
        <p className="text-town-muted max-w-xl mb-16 leading-relaxed">
          Town guides, Massachusetts culture, and the case for repping where you&apos;re
          actually from.
        </p>
        <div className="space-y-12">
          {sorted.map((post) => (
            <article key={post.slug} className="border-b border-town-rule pb-12">
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs uppercase tracking-[0.14em] text-town-forest font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h2 className="font-block uppercase text-2xl sm:text-4xl text-town-navy hover:text-town-forest transition-colors mb-3 leading-[0.98]">
                  {post.title}
                </h2>
              </Link>
              <p className="text-town-muted mb-4 leading-relaxed">{post.description}</p>
              <div className="flex items-center gap-4 text-sm text-town-muted">
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
                <span>·</span>
                <span>{post.readTime} min read</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
