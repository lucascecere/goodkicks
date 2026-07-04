import Link from 'next/link';
import { BrandLogo } from '@/components/brand/brand-logo';
import { BrandPattern } from '@/components/townies/brand-pattern';

export default function NotFound() {
  return (
    <div className="relative overflow-hidden bg-town-cream min-h-[78vh] flex items-center justify-center px-4">
      <BrandPattern variant="ma" color="forest" opacity={0.06} size={150} fade="radial" />
      <div className="relative text-center max-w-md mx-auto py-16">
        <BrandLogo variant="sign" className="w-44 sm:w-52 mx-auto mb-8" />
        <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium mb-3">
          Off the map
        </p>
        <h1 className="font-block uppercase text-5xl sm:text-6xl text-town-navy mb-4">
          Wrong turn.
        </h1>
        <p className="text-town-muted leading-relaxed mb-8">
          We couldn&apos;t find that page. Let&apos;s get you back to your town.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-5">
          <Link
            href="/"
            className="inline-flex items-center bg-town-forest text-white px-7 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-town-forest/90 transition-colors"
          >
            Back home
          </Link>
          <Link
            href="/shop"
            className="text-sm lowercase tracking-wide text-town-navy underline underline-offset-4 hover:text-town-forest transition-colors"
          >
            browse the towns
          </Link>
        </div>
      </div>
    </div>
  );
}
