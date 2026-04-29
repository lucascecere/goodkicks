import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer>
      {/* Dark top band */}
      <div className="bg-brand-ink text-white px-4 py-16 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center sm:items-end justify-between gap-8">
          <div className="font-display text-7xl sm:text-8xl text-white/10 select-none leading-none">GK</div>
          <div className="text-center sm:text-right">
            <p className="font-display text-2xl sm:text-3xl text-white/90 mb-2">make the circle bigger.</p>
            <p className="text-white/50 text-sm">goodkicks.co</p>
          </div>
        </div>
      </div>

      {/* Link grid */}
      <div className="bg-brand-ink/95 text-white/70 px-4 py-10 sm:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
          <div>
            <h3 className="text-white text-xs uppercase tracking-wider mb-3 font-medium">shop</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-white transition-colors">the good kick</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white text-xs uppercase tracking-wider mb-3 font-medium">brand</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-white transition-colors">about</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white text-xs uppercase tracking-wider mb-3 font-medium">help</h3>
            <ul className="space-y-2">
              <li><Link href="/contact" className="hover:text-white transition-colors">contact</Link></li>
              <li>
                <a
                  href="https://goodkicks.myshopify.com/policies/shipping-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  shipping &amp; returns
                </a>
              </li>
              <li>
                <a
                  href="https://goodkicks.myshopify.com/policies/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  privacy &amp; terms
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-brand-ink/95 text-white/40 px-4 py-4 sm:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <p>© {year} Good Kicks</p>
          <a
            href="https://instagram.com/goodkicks"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Good Kicks on Instagram"
            className="hover:text-white transition-colors text-xs tracking-wide"
          >
            @goodkicks
          </a>
        </div>
      </div>
    </footer>
  );
}
