import type { Metadata } from 'next';
import Link from 'next/link';
import { PageMasthead } from '@/components/townies/page-masthead';
import { gkCanonical } from '@/lib/seo/site';

// Deliberately NOT shared with the Townies shipping page. The facts genuinely
// differ: a foot bag is a light, flat-rate item with no sizing, so there is no
// free-shipping threshold, no unworn/unwashed condition, and no made-to-order
// final-sale carve-out.
export const metadata: Metadata = {
  title: 'Shipping & Returns',
  description: 'How Good Kicks orders ship, how long they take, and how returns work.',
  alternates: { canonical: gkCanonical('shipping-returns') },
  openGraph: {
    title: 'Shipping & Returns — Good Kicks',
    description: 'How Good Kicks orders ship, how long they take, and how returns work.',
    url: gkCanonical('shipping-returns'),
  },
};

export default function Page() {
  return (
    <div className="bg-bg">
      <PageMasthead eyebrow="The details" title="shipping & returns." sub="Last updated August 2026" pattern="none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-14 sm:py-20 space-y-10">
        <Section title="Shipping">
          <p>Every Good Kicks order ships from <Strong>Massachusetts</Strong>, usually within <Strong>1–3 business days</Strong>.</p>
          <p>Sacks are small and light, so <Strong>shipping is on us</Strong> — there is no minimum and no threshold to hit.</p>
          <p>Bags go out via USPS. Domestic orders typically land within <Strong>3–7 business days</Strong>, and you&apos;ll get a tracking email the moment yours ships.</p>
          <p>We ship within the <Strong>United States only</Strong> for now.</p>
        </Section>
        <Rule />
        <Section title="Returns & Exchanges">
          <p>Not feeling it? Unused sacks can be sent back within <Strong>30 days</Strong> of delivery for a refund or a swap to a different colorway.</p>
          <p>Return postage is on us if we got the order wrong — otherwise it&apos;s on you. Refunds land on the original payment method once the bag is back with us.</p>
          <p>A sack that&apos;s been played with is a used sack, so those we can&apos;t take back unless something was actually wrong with it.</p>
        </Section>
        <Rule />
        <Section title="Damaged or Wrong Items">
          <p>If a bag turns up damaged, split at a seam, or just isn&apos;t what you ordered, send us a photo and your order number within <Strong>7 days</Strong> and we&apos;ll make it right. No runaround.</p>
        </Section>
        <Rule />
        <Section title="Lost or Stolen Packages">
          <p>Once tracking says delivered we can&apos;t take responsibility for a parcel going missing — check with housemates, the mailroom, and your local post office first. If it&apos;s genuinely gone, get in touch and we&apos;ll do what we can.</p>
        </Section>
        <Rule />
        <Section title="Questions?">
          <p>Anything else, ask us on the{' '}<Link href="/goodkicks/support" className="text-accent underline underline-offset-4 hover:text-text transition-colors">support page</Link>.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="heading text-xl sm:text-2xl text-text mb-3">{title}</h2>
      <div className="space-y-3 text-muted leading-relaxed">{children}</div>
    </section>
  );
}
function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="text-text">{children}</strong>;
}
function Rule() {
  return <div className="border-t border-rule" />;
}
