import Image from 'next/image';
import { fetchInstagramPosts } from '@/lib/instagram';

const STATIC_POSTS = [
  { id: 'newyork',   src: '/brand/post_newyork.jpg',   alt: 'Good Kicks New York colorway' },
  { id: 'montana',   src: '/brand/post_montana.jpg',   alt: 'Good Kicks Montana colorway' },
  { id: 'maine',     src: '/brand/post_maine.jpg',     alt: 'Good Kicks Maine colorway' },
  { id: 'newmexico', src: '/brand/post_newmexico.jpg', alt: 'Good Kicks New Mexico colorway' },
  { id: 'tennessee', src: '/brand/post_tennessee.jpg', alt: 'Good Kicks Tennessee colorway' },
];

export async function InstagramFeed() {
  const posts = await fetchInstagramPosts(6);

  return (
    <section className="py-20 px-6 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl sm:text-5xl text-brand-ink mb-4">
            spotted in the circle.
          </h2>
          <a
            href="https://instagram.com/goodkicksco"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-rust hover:underline text-sm"
          >
            @goodkicksco ↗
          </a>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {posts.map((post) => (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square relative rounded-lg overflow-hidden bg-brand-rule group"
              >
                <Image
                  src={post.media_url}
                  alt={post.caption?.slice(0, 80) ?? 'Good Kicks on Instagram'}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STATIC_POSTS.map((post) => (
              <a
                key={post.id}
                href="https://instagram.com/goodkicksco"
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square relative rounded-lg overflow-hidden bg-[#F5EFE3] group"
              >
                <Image
                  src={post.src}
                  alt={post.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
