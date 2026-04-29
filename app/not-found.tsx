import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <div className="text-6xl">🏐</div>
        <h1 className="font-display text-4xl sm:text-5xl text-brand-ink">this kick missed.</h1>
        <p className="text-brand-muted max-w-sm mx-auto">
          we can&apos;t find that page. want to get back to the circle?
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-brand-rust text-white px-6 py-3 rounded font-medium hover:bg-brand-rust/90 transition-colors"
        >
          back home →
        </Link>
      </div>
    </div>
  );
}
