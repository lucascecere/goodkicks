import type { Metadata } from 'next';
import Link from 'next/link';
import { gkCanonical } from '@/lib/seo/site';

// The Good Kicks story, told from Good Kicks' side.
//
// The Townies /about page tells this history the other way round — Townies as
// the thing that grew out of Good Kicks. Both are true; which one leads depends
// on whose site you are standing on. A visitor who came to goodkicks.co for a
// foot bag should not have to read a hat brand's origin story to find out what
// they're buying.

export const metadata: Metadata = {
  title: 'About',
  description:
    'Good Kicks makes premium 32-panel foot bags — what most people call hacky sacks — built to actually last.',
  alternates: { canonical: gkCanonical('about') },
  openGraph: {
    title: 'About — Good Kicks',
    description: 'Why we make foot bags, and why ours are built differently.',
    url: gkCanonical('about'),
  },
};

export default function Page() {
  return (
    <div className="bg-brand-cream min-h-screen">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 pt-16 sm:pt-24 pb-6">
        <p className="text-xs uppercase tracking-widest text-brand-rust font-medium mb-3">
          Our story
        </p>
        <h1 className="font-display text-4xl sm:text-6xl text-brand-ink mb-4">
          keep the circle going.
        </h1>
      </div>

      <div className="max-w-3xl mx-auto px-6 sm:px-8 pb-20 sm:pb-28 space-y-10">
        <Section title="Why foot bags">
          <p>
            Every circle has one bag, and everyone knows whose it is. It lives in a backpack, comes
            out on the quad between classes, and holds a group together for twenty minutes at a
            time with nothing else required — no field, no teams, no score.
          </p>
          <p>
            The problem was never the game. It was that the cheap bags fall apart. Loose fill,
            split seams, dead in a fortnight.
          </p>
        </Section>

        <Rule />

        <Section title="What makes ours different">
          <p>
            Ours are <Strong>32-panel</Strong> and properly weighted — rounder and more forgiving
            than the flat, loosely-filled bags you find in a discount bin, which means they are
            easier to control on your first kicks and still good enough for people who can actually
            play.
          </p>
          <p>
            They&apos;re made by a manufacturer that has been producing foot bags for{' '}
            <Strong>30+ years</Strong>. With regular play, expect one to last a year or two rather
            than a couple of weeks.
          </p>
        </Section>

        <Rule />

        <Section title="Where we fit">
          <p>
            Good Kicks is the sports line of{' '}
            <a
              href="https://townies.shop"
              className="text-brand-rust underline underline-offset-4 hover:text-brand-ink transition-colors"
            >
              Townies
            </a>
            , a Massachusetts apparel company. Same people, same standard, different game — Townies
            makes town-pride apparel, and this is where the sports gear lives.
          </p>
          <p>
            Practically, that means a bigger operation behind a small product: real fulfilment, a
            real support inbox, and a return policy written by someone you can actually reach.
          </p>
        </Section>

        <Rule />

        <Section title="Reps">
          <p>
            We work with high school and college accounts — free starter sack, your own discount
            code, commission on everything it drives. If you run a circle, a club, or a page,{' '}
            <Link
              href="/goodkicks#ambassadors"
              className="text-brand-rust underline underline-offset-4 hover:text-brand-ink transition-colors"
            >
              come talk to us
            </Link>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl sm:text-2xl text-brand-ink mb-3">{title}</h2>
      <div className="space-y-3 text-brand-muted leading-relaxed">{children}</div>
    </section>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="text-brand-ink">{children}</strong>;
}

function Rule() {
  return <div className="border-t border-brand-rule" />;
}
