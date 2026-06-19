import Link from 'next/link';

export function BogoSection() {
  return (
    <section className="bg-brand-ink py-16 sm:py-20 px-6">
      <div className="max-w-2xl mx-auto text-center space-y-5">
        <span className="inline-block bg-brand-rust text-white text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
          limited time
        </span>
        <h2 className="font-display text-4xl sm:text-5xl text-brand-cream">buy one, get one free.</h2>
        <p className="text-brand-cream/60 text-base sm:text-lg leading-relaxed">
          two kicks for the price of one. add any two colorways to your cart and use code{' '}
          <span className="font-mono font-bold text-brand-cream tracking-widest">BOGOKICKS</span>{' '}
          at checkout.
        </p>
        <Link
          href="/shop"
          className="inline-block bg-brand-rust text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-brand-rust/90 transition-colors"
        >
          shop the deal →
        </Link>
      </div>
    </section>
  );
}
