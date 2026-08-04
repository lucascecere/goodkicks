import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllTownieSlugs, getTowniePostBySlug } from '@/lib/townies/blog-posts';
import { BrandPattern } from '@/components/townies/brand-pattern';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllTownieSlugs().map((slug: string) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getTowniePostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: `${post.title} — Townies`,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      tags: post.tags,
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: ['/opengraph-image.png'],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getTowniePostBySlug(slug);
  if (!post) notFound();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: 'Townies Apparel Co.', url: 'https://townies.shop' },
    publisher: {
      '@type': 'Organization',
      name: 'Townies Apparel Co.',
      url: 'https://townies.shop',
      logo: { '@type': 'ImageObject', url: 'https://townies.shop/icon.png' },
    },
  };

  return (
    <div className="relative overflow-hidden bg-town-cream min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <BrandPattern variant="ma" color="forest" opacity={0.04} size={220} fade="b" />
      <div className="relative max-w-2xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <Link
          href="/blog"
          className="text-town-muted hover:text-town-navy text-sm mb-8 inline-block transition-colors"
        >
          ← the town paper
        </Link>
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs uppercase tracking-[0.14em] text-town-forest font-semibold"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="font-block uppercase text-3xl sm:text-5xl text-town-navy mb-4 leading-[0.98]">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-town-muted mb-8">
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
        <hr className="border-town-rule mb-8" />
        <div
          className="max-w-none leading-relaxed text-town-navy/90 space-y-4 [&_h2]:font-block [&_h2]:uppercase [&_h2]:text-town-navy [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-town-navy [&_strong]:font-semibold [&_em]:italic"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        <div className="mt-16 rounded-sm bg-town-navy text-town-cream p-8 text-center space-y-4">
          <p className="font-block uppercase text-2xl sm:text-3xl">Rep your town.</p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center bg-town-cream text-town-navy px-6 py-3 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-white transition-colors"
          >
            Shop the hats →
          </Link>
        </div>
      </div>
    </div>
  );
}
