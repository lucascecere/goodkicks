import type { Metadata } from 'next';
import { AmbassadorForm } from '@/components/partners/ambassador-form';

export const metadata: Metadata = {
  title: 'Town Rep Program — Townies',
  description:
    'Rep your town the loudest? Become a Townies Town Rep. Get a free hat, your own discount code, and earn commission on every sale you drive.',
  alternates: { canonical: '/ambassadors' },
  openGraph: {
    title: 'Townies Town Rep Program',
    description: 'Free hat, your own discount code, and commission on every sale you drive.',
    url: '/ambassadors',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Townies Town Rep Program',
    description: 'Free hat, your own discount code, earn commission on every sale.',
    images: ['/opengraph-image.png'],
  },
};

export default function TownRepPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-town-navy text-town-cream py-20 sm:py-24 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <p className="text-xs uppercase tracking-[0.22em] text-town-cream/50 font-medium">
            Townies Town Rep Program
          </p>
          <h1 className="font-block uppercase text-4xl sm:text-6xl lg:text-7xl leading-[0.9]">
            Rep your town.<br />We&apos;ll back you.
          </h1>
          <p className="text-town-cream/70 text-lg max-w-2xl mx-auto leading-relaxed">
            If you&apos;re already the one repping your town the loudest — the local account, the
            hometown-proud creator, the person everyone knows is from there — we want to back you.
            Free hats, your own code, and a cut of every sale you drive.
          </p>
          <a
            href="#apply"
            className="inline-block bg-town-forest text-white px-8 py-4 rounded-sm font-semibold uppercase tracking-[0.1em] text-sm hover:bg-town-forest/90 transition-colors"
          >
            Apply now →
          </a>
        </div>
      </section>

      {/* The deal */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-town-cream">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium">The deal</p>
            <h2 className="font-block uppercase text-3xl sm:text-4xl text-town-navy leading-[0.95]">
              Free hat. Your own code. Real commission.
            </h2>
            <p className="text-town-muted leading-relaxed">
              Townies makes town-pride hats for people who actually rep where they&apos;re from. If
              that&apos;s you — and your people trust what you put on — a Town Rep partnership gets
              you the product free, your own discount code, and a cut of every order you drive.
            </p>
            <p className="text-town-muted leading-relaxed">
              No quotas you can&apos;t hit, no corporate nonsense. You promote your town, your
              followers save, you earn.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['#0D1B2A', '#2F4F3A', '#F2EFE8', '#7A1E1E', '#4B2E83', '#111111'].map((color, i) => (
              <div
                key={i}
                className="aspect-square rounded-sm shadow-sm ring-1 ring-town-rule"
                style={{ background: color }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-[#EAE6DB]">
        <div className="max-w-4xl mx-auto text-center space-y-3 mb-12 sm:mb-16">
          <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium">What you get</p>
          <h2 className="font-block uppercase text-3xl sm:text-4xl text-town-navy">The perks.</h2>
          <p className="text-town-muted max-w-xl mx-auto">We keep it simple. You promote, your followers save, you earn.</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              title: 'Your own code.',
              body: 'A custom code tied to your town — think MILTON15, WEYMOUTH15. Anyone who uses it saves on any Townies hat, and every order it touches is tracked back to you automatically.',
            },
            {
              title: 'Real commission.',
              body: 'You earn a straight percentage of every order placed with your code — no thresholds to clear, no points to chase. We set your rate when we bring you on. Paid out monthly via Venmo or PayPal.',
            },
            {
              title: 'Free hat.',
              body: 'Approved reps get their town’s hat shipped free, so you can post with the real thing in hand. Keep it moving and we keep the product coming.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-town-cream rounded-sm p-8 space-y-3 border border-town-rule">
              <h3 className="font-block uppercase text-xl text-town-navy">{item.title}</h3>
              <p className="text-town-muted text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The numbers */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-town-cream">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium">The numbers</p>
            <h2 className="font-block uppercase text-3xl sm:text-4xl text-town-navy">No tiers. No games.</h2>
            <p className="text-town-muted max-w-xl mx-auto">
              We don&apos;t make you grind through levels to earn a real rate. We agree on your
              numbers when you come on, and that&apos;s what you get from order one.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                stat: '15%',
                label: 'Off for your followers',
                body: 'The standard code we start reps at. Bigger audience, or a town we really want? We go higher.',
              },
              {
                stat: 'Up to 20%',
                label: 'Commission to you',
                body: 'A straight cut of every order your code brings in — not of our margin, not of some adjusted number.',
              },
              {
                stat: 'Monthly',
                label: 'Payouts',
                body: 'Venmo or PayPal, with your own live dashboard so you always know what you are owed before we send it.',
              },
            ].map((item) => (
              <div key={item.label} className="bg-[#EAE6DB] rounded-sm p-8 space-y-2 border border-town-rule">
                <p className="font-block uppercase text-4xl text-town-navy leading-none">{item.stat}</p>
                <h3 className="font-semibold text-town-navy text-sm uppercase tracking-wide">{item.label}</h3>
                <p className="text-town-muted text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-[#EAE6DB]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium">The process</p>
            <h2 className="font-block uppercase text-3xl sm:text-4xl text-town-navy">How it works.</h2>
          </div>
          <div className="space-y-0">
            {[
              { step: '01', title: 'Apply below.', body: 'Fill out the form. Tell us your town, your account, and how you rep it. Takes two minutes.' },
              { step: '02', title: 'We review + approve.', body: "We check that you're the real deal — actually from the town, actually repping it — and reach out within a few days." },
              { step: '03', title: 'Get your code + free hat.', body: 'Once approved, we send your custom code and your town’s hat free, so you can post with the real product in hand.' },
              { step: '04', title: 'Post. Earn. Repeat.', body: 'Share your code, watch the orders come in, and get paid monthly. We track everything on our end.' },
            ].map((item, i, arr) => (
              <div key={item.step} className={`flex gap-6 sm:gap-8 py-8 ${i < arr.length - 1 ? 'border-b border-town-rule' : ''}`}>
                <span className="font-block text-4xl text-town-navy/25 flex-shrink-0 w-14">{item.step}</span>
                <div className="space-y-1">
                  <h3 className="font-block uppercase text-xl sm:text-2xl text-town-navy">{item.title}</h3>
                  <p className="text-town-muted leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who we're looking for */}
      <section className="py-16 px-4 sm:px-8 bg-town-navy text-town-cream">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="font-block uppercase text-3xl sm:text-4xl">Who we&apos;re looking for.</h2>
          <p className="text-town-cream/70 leading-relaxed max-w-xl mx-auto">
            People who rep their town for real — doesn&apos;t matter if it&apos;s 200 followers or
            20k. We care about genuine hometown pride and engagement over follower count. If your
            people actually know where you&apos;re from, you&apos;re probably a fit.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-left">
            {[
              { label: 'Town & local accounts', desc: 'Pages built around a town, neighborhood, or region — the ones everyone from there follows.' },
              { label: 'Hometown creators', desc: 'Local personalities, athletes, and creators who lead with where they’re from.' },
              { label: 'Massholes with a following', desc: 'If your whole thing is Massachusetts pride and your audience is here, let’s talk.' },
            ].map((item) => (
              <div key={item.label} className="border border-town-cream/20 rounded-sm p-5 space-y-2">
                <p className="font-semibold text-town-cream text-sm">{item.label}</p>
                <p className="text-town-cream/50 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="py-16 sm:py-20 px-4 sm:px-8 bg-town-cream">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium">Apply</p>
            <h2 className="font-block uppercase text-3xl sm:text-4xl text-town-navy">Become a Town Rep.</h2>
            <p className="text-town-muted">We&apos;ll get back to you within a few days.</p>
          </div>
          <AmbassadorForm brand="townies" />
        </div>
      </section>
    </>
  );
}
