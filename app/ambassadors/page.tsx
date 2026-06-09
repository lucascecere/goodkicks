import type { Metadata } from 'next';
import { AmbassadorForm } from '@/components/partners/ambassador-form';

export const metadata: Metadata = {
  title: 'Ambassador Program — Good Kicks',
  description:
    'Run a school hacky sack account? Join the Good Kicks ambassador program. Get a free starter sack, your own discount code, and earn commission on every sale you drive.',
  alternates: { canonical: '/ambassadors' },
  openGraph: {
    title: 'Good Kicks Ambassador Program',
    description: 'Get a free starter sack, your own discount code, and earn commission on every sale you drive.',
    url: '/ambassadors',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Good Kicks Ambassador Program',
    description: 'Free starter sack, your own discount code, earn commission on every sale.',
    images: ['/opengraph-image.png'],
  },
};

export default function PartnersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-brand-ink text-white py-24 px-6 sm:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <p className="text-xs uppercase tracking-widest text-white/50 font-medium text-center max-w-none">goodkicks brand ambassador program</p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-none">
            you run the circle.<br />we&apos;ll back it.
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
            we&apos;re building partnerships with school hacky sack accounts — high school, college, whatever. if you&apos;re already hyping the scene at your school, we want to back you with free product, your own discount code, and a cut of every sale.
          </p>
          <a
            href="#apply"
            className="inline-block bg-brand-rust text-white px-8 py-4 rounded font-medium text-lg hover:bg-brand-rust/90 transition-colors"
          >
            apply now →
          </a>
        </div>
      </section>

      {/* What is Good Kicks */}
      <section className="py-20 px-6 sm:px-8 bg-brand-cream">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest text-brand-muted font-medium text-center max-w-none">the product</p>
              <h2 className="font-display text-4xl text-brand-ink">premium materials. properly weighted. $9.99.</h2>
              <p className="text-brand-muted leading-relaxed">
                Good Kicks foot bags are made by the same crew that&apos;s been making them for 30+ years. Not the $4 Amazon junk. Not the $40 premium stuff. Just the right foot bag at the right price — built for dorm circles, lunch tables, and every campus quad that needs one.
              </p>
              <p className="text-brand-muted leading-relaxed">
                we sell direct, ship in 1–2 weeks, and offer $4 flat-rate shipping — free on orders $35+. six colorways. one circle.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['#C15A3A','#5A5E68','#5BA4B4','#A89870','#D4A84B','#4A4848'].map((color, i) => ( // georgia, maine, colorado, new york, nevada, massachusetts
                <div
                  key={i}
                  className="aspect-square rounded-full shadow-sm ring-1 ring-brand-rule"
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Program */}
      <section className="py-20 px-6 sm:px-8 bg-[#EFE8DA]">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <p className="text-xs uppercase tracking-widest text-brand-muted font-medium text-center max-w-none">what you get</p>
          <h2 className="font-display text-4xl text-brand-ink">the goodkicks ambassador program.</h2>
          <p className="text-brand-muted max-w-xl mx-auto">we keep it simple. you promote, your followers save, you earn.</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              title: 'your own code.',
              body: 'get a custom discount code tied to your school or account (e.g. OHIO15, DUKE15). your followers start at 15% off and get bigger codes (up to 20%) as you level up.',
            },
            {
              title: 'earn as you grow.',
              body: 'earn 8% commission on every order placed with your code at the starter tier. level up to 12% (repping) or 20% (anchor) by posting consistently and driving sales. paid out monthly via venmo or paypal.',
            },
            {
              title: 'free starter sack.',
              body: 'approved ambassadors get a free sack shipped to them in your colorway of choice — so you can post with the real product in hand. level up and we keep the product coming.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-brand-cream rounded-xl p-8 space-y-3 border border-brand-rule">
              <h3 className="font-display text-2xl text-brand-ink">{item.title}</h3>
              <p className="text-brand-muted text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Tiers */}
      <section className="py-20 px-6 sm:px-8 bg-brand-cream">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-xs uppercase tracking-widest text-brand-muted font-medium text-center max-w-none">levels</p>
            <h2 className="font-display text-4xl text-brand-ink">the tiers.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                tier: 'starter.',
                body: 'sign up, get approved. 1 free sack, your personal 15% off code, 8% commission on every sale through your code.',
              },
              {
                tier: 'repping.',
                body: 'hit 8+ tagged posts or 10+ code redemptions. bumps your code to 20% off, your commission to 12%, plus more product sent your way.',
              },
              {
                tier: 'anchor.',
                body: 'hit 23+ posts or 38+ redemptions. 20% off code, 20% commission, ongoing product support, and a shot at a custom-colorway named partnership.',
              },
            ].map((item) => (
              <div key={item.tier} className="bg-[#EFE8DA] rounded-xl p-8 space-y-3 border border-brand-rule">
                <h3 className="font-display text-2xl text-brand-ink">{item.tier}</h3>
                <p className="text-brand-muted text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 sm:px-8 bg-[#EFE8DA]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <p className="text-xs uppercase tracking-widest text-brand-muted font-medium text-center max-w-none">the process</p>
            <h2 className="font-display text-4xl text-brand-ink">how it works.</h2>
          </div>
          <div className="space-y-0">
            {[
              {
                step: '01',
                title: 'apply below.',
                body: 'fill out the form. tell us about your account, your school, and how you hype the sack community. takes 2 minutes.',
              },
              {
                step: '02',
                title: 'we review + approve.',
                body: "we look at your account, make sure it's a real school sack community (not 12 followers and a burner), and reach out within a few days.",
              },
              {
                step: '03',
                title: 'get your code + free sack.',
                body: "once approved, we send your custom promo code and a free starter sack in your colorway of choice so you can post with the real product in hand.",
              },
              {
                step: '04',
                title: 'post. earn. repeat.',
                body: "share your code with your followers, watch the orders come in, and get paid monthly. we track everything on our end.",
              },
            ].map((item, i, arr) => (
              <div key={item.step} className={`flex gap-8 py-8 ${i < arr.length - 1 ? 'border-b border-brand-rule' : ''}`}>
                <span className="font-display text-4xl text-brand-rule flex-shrink-0 w-14">{item.step}</span>
                <div className="space-y-1">
                  <h3 className="font-display text-2xl text-brand-ink">{item.title}</h3>
                  <p className="text-brand-muted leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who we're looking for */}
      <section className="py-16 px-6 sm:px-8 bg-brand-ink text-white">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="font-display text-4xl">who we&apos;re looking for.</h2>
          <p className="text-white/70 leading-relaxed max-w-xl mx-auto">
            school hacky sack accounts — doesn&apos;t matter if it&apos;s 200 followers or 20k. we care more about engagement and genuine community than numbers. if your followers actually sack, you&apos;re probably a fit.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-left">
            {[
              { label: 'high school accounts', desc: 'lunchtime circles, after-school crews, school-named sack accounts.' },
              { label: 'college accounts', desc: 'dorm circles, campus quads, greek chapter groups, rec clubs.' },
              { label: 'general sack accounts', desc: 'freestyle channels, trick accounts, sack-focused creators.' },
            ].map((item) => (
              <div key={item.label} className="border border-white/20 rounded-lg p-5 space-y-2">
                <p className="font-medium text-white text-sm">{item.label}</p>
                <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="py-20 px-6 sm:px-8 bg-brand-cream">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <p className="text-xs uppercase tracking-widest text-brand-muted font-medium text-center max-w-none">apply</p>
            <h2 className="font-display text-4xl text-brand-ink">become an ambassador.</h2>
            <p className="text-brand-muted">we&apos;ll get back to you within a few days.</p>
          </div>
          <AmbassadorForm />
        </div>
      </section>
    </>
  );
}
