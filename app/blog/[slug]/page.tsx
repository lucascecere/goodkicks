import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllSlugs, getPostBySlug } from '@/lib/blog/posts';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllSlugs().map((slug: string) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: 'Good Kicks', url: 'https://goodkicks.co' },
    publisher: {
      '@type': 'Organization',
      name: 'Good Kicks',
      url: 'https://goodkicks.co',
      logo: { '@type': 'ImageObject', url: 'https://goodkicks.co/icon.png' },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <Link href="/blog" className="text-brand-muted hover:text-brand-ink text-sm mb-8 inline-block transition-colors">
          ← all posts
        </Link>
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag: string) => (
            <span key={tag} className="text-xs uppercase tracking-wide text-brand-rust font-medium">
              {tag}
            </span>
          ))}
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-brand-ink mb-4 leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-brand-muted mb-8">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
          </time>
          <span>·</span>
          <span>{post.readTime} min read</span>
        </div>
        <hr className="border-brand-rule mb-8" />
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        <div className="mt-16 rounded-xl bg-brand-rust text-white p-8 text-center space-y-4">
          <p className="font-display text-2xl">get one going.</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-white text-brand-rust px-6 py-3 rounded font-medium hover:bg-brand-cream transition-colors"
          >
            shop the good kick →
          </Link>
        </div>
      </div>
    </>
  );
}
