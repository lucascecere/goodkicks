import Image from 'next/image';
import Link from 'next/link';
import { fetchInstagramReels } from '@/lib/instagram';

function ReelCard({ post }: { post: { id: string; permalink: string; media_url: string; thumbnail_url?: string; caption?: string } }) {
  const thumb = post.thumbnail_url ?? post.media_url;
  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow aspect-[9/16] relative bg-brand-rule"
    >
      {thumb && (
        <Image
          src={thumb}
          alt={post.caption?.slice(0, 80) ?? 'Good Kicks on Instagram'}
          fill
          sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 22vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/50 transition-colors">
          <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-1">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </a>
  );
}

export async function InstagramFeed() {
  const reels = await fetchInstagramReels(6);

  if (reels.length === 0) return null;

  return (
    <section className="py-20 px-6 sm:px-8 bg-brand-cream">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl sm:text-5xl text-brand-ink mb-3">
            see it in action.
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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {reels.map((reel) => (
            <ReelCard key={reel.id} post={reel} />
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="https://instagram.com/goodkicksco"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-rust transition-colors"
          >
            follow @goodkicksco for more →
          </Link>
        </div>
      </div>
    </section>
  );
}
