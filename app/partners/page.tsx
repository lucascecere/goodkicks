import type { Metadata } from 'next';
import { AmbassadorForm } from '@/components/partners/ambassador-form';

export const metadata: Metadata = {
  title: 'GoodKicks Brand Ambassador Program',
  description:
    'Run a school hacky sack account? Join the GoodKicks Brand Ambassador Program. Get your own custom discount code, earn 8–10% commission on every sale, and receive a free starter pack.',
};

export default function PartnersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-brand-ink text-white py-24 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <p className="text-xs uppercase tracking-widest text-white/50 font-medium text-center max-w-none">goodkicks brand ambassador program</p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-none">
            you run the circle.<br />we&apos;ll back it.
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
            we&apos;re building partnerships with school hacky sack accounts — high school, college, whatever. if you&apos;re already hyping the scene at your school, we want to help you do it.
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
      <section className="py-20 px-4 sm:px-8 bg-brand-cream">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest text-brand-muted font-medium text-center max-w-none">the product</p>
              <h2 className="font-display text-4xl text-brand-ink">hand-stitched. properly weighted. $18.</h2>
              <p className="text-brand-muted leading-relaxed">
                Good Kicks foot bags are hand-crocheted by the same crew that&apos;s been making them for 30+ years. Not the $4 Amazon junk. Not the $40 premium stuff. Just the right foot bag at the right price — built for dorm circles, lunch tables, and every campus quad that needs one.
              </p>
              <p className="text-brand-muted leading-relaxed">
                we sell direct, ship in 1–2 weeks, and offer free shipping on orders $35+. six colorways. one circle.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['#C15A3A','#5A5E68','#5BA4B4','#A89870','#D4A84B','#4A4848'].map((color, i) => ( // georgia, maine, colorado, new york, nevada, california
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
      <section className="py-20 px-4 sm:px-8 bg-[#EFE8DA]">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <p className="text-xs uppercase tracking-widest text-brand-muted font-medium text-center max-w-none">what you get</p>
          <h2 className="font-display text-4xl text-brand-ink">the goodkicks ambassador program.</h2>
          <p className="text-brand-muted max-w-xl mx-auto">we keep it simple. you promote, your followers save, you earn.</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              title: 'your own code.',
              body: 'get a custom discount code tied to your school or account (e.g. OHIO20, DUKE20). your followers get 20% off. you get credit for every sale.',
            },
            {
              title: '8–10% commission.',
              body: 'earn 8–10% on every order placed with your code. no cap. paid out monthly. the more you post, the more you earn.',
            },
            {
              title: 'free starter pack.',
              body: 'approved ambassadors get a free 3-pack shipped to them — so you can actually show the product to your circle before you hype it.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-brand-cream rounded-xl p-8 space-y-3 border border-brand-rule">
              <h3 className="font-display text-2xl text-brand-ink">{item.title}</h3>
              <p className="text-brand-muted text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-8 bg-brand-cream">
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
                body: 'fill out the form. tell us about your account, your school, and how you hype the sac community. takes 2 minutes.',
              },
              {
                step: '02',
                title: 'we review + approve.',
                body: "we look at your account, make sure it's a real school sac community (not 12 followers and a burner), and reach out within a few days.",
              },
              {
                step: '03',
                title: 'get your code + free kicks.',
                body: "once approved, we send your custom promo code and a free 3-pack so you can post with the real product in hand.",
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
      <section className="py-16 px-4 sm:px-8 bg-brand-ink text-white">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="font-display text-4xl">who we&apos;re looking for.</h2>
          <p className="text-white/70 leading-relaxed max-w-xl mx-auto">
            school hacky sack accounts — doesn&apos;t matter if it&apos;s 200 followers or 20k. we care more about engagement and genuine community than numbers. if your followers actually sac, you&apos;re probably a fit.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-left">
            {[
              { label: 'high school accounts', desc: 'lunchtime circles, after-school crews, school-named sac accounts.' },
              { label: 'college accounts', desc: 'dorm circles, campus quads, greek chapter groups, rec clubs.' },
              { label: 'general sac accounts', desc: 'freestyle channels, trick accounts, sac-focused creators.' },
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
      <section id="apply" className="py-20 px-4 sm:px-8 bg-brand-cream">
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
