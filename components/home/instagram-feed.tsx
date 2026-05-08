import Image from 'next/image';
import Link from 'next/link';
import { fetchInstagramPosts } from '@/lib/instagram';

const STATIC_POSTS = [
  { id: 'montana',    state: 'montana',    image: '/brand/sack_montana.png' },
  { id: 'california', state: 'california', image: '/brand/sack_california.png' },
  { id: 'tennessee',  state: 'tennessee',  image: '/brand/sack_tennessee.png' },
  { id: 'newmexico',  state: 'new mexico', image: '/brand/sack_newmexico.png' },
  { id: 'maine',      state: 'maine',      image: '/brand/sack_maine.png' },
  { id: 'newyork',    state: 'new york',   image: '/brand/sack_newyork.png' },
];

function StaticPostCard({ state, image }: { state: string; image: string }) {
  return (
    <a
      href="https://instagram.com/goodkicksco"
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      style={{ backgroundColor: '#EDE6D6' }}
    >
      <div className="aspect-[4/5] flex flex-col items-center justify-between py-5 px-3">
        <p
          className="font-display text-center leading-none text-brand-ink group-hover:text-brand-rust transition-colors"
          style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.6rem)' }}
        >
          {state}
        </p>

        <div className="relative w-4/5 aspect-square my-2">
          <Image
            src={image}
            alt={`Good Kicks ${state} colorway`}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
            className="object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <p className="text-[11px] sm:text-xs text-brand-muted tracking-wide">goodkicks.co</p>
      </div>
    </a>
  );
}

function LivePostCard({ post }: { post: { id: string; permalink: string; media_url: string; caption?: string } }) {
  return (
    <a
      key={post.id}
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow aspect-square relative bg-brand-rule"
    >
      <Image
        src={post.media_url}
        alt={post.caption?.slice(0, 80) ?? 'Good Kicks on Instagram'}
        fill
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </a>
  );
}

export async function InstagramFeed() {
  const posts = await fetchInstagramPosts(6);

  return (
    <section className="py-20 px-6 sm:px-8 bg-brand-cream">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl sm:text-5xl text-brand-ink mb-3">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {posts.map((post) => (
              <LivePostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {STATIC_POSTS.map((post) => (
              <StaticPostCard key={post.id} state={post.state} image={post.image} />
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            href="https://instagram.com/goodkicksco"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-rust transition-colors"
          >
            follow us for drops, circles, and good kicks →
          </Link>
        </div>
      </div>
    </section>
  );
}
