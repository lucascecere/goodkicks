import Link from 'next/link';

// The privacy policy and terms, once.
//
// Townies and Good Kicks are one legal entity taking payment through one
// Shopify checkout with one analytics setup, so the policy is genuinely the
// same document. Two hand-maintained copies would not be "a Good Kicks version"
// — it would be two divergent privacy policies for one company, which is a
// liability rather than a feature. So each brand gets its own PAGE and its own
// chrome, and this is the body they share.
//
// Styling uses the semantic tokens (text-text / text-muted / border-rule /
// text-accent / font-heading), which app/globals.css already redefines under
// [data-brand="goodkicks"] — so this renders in each brand's palette and
// heading face with no branching here.

export const PRIVACY_UPDATED = 'June 2026';

/** Where "questions about this policy" should point, per brand. */
type Props = { supportHref: string };

export function PrivacyContent({ supportHref }: Props) {
  return (
    <div className="space-y-10 text-text">
      <Section title="What We Collect">
        <p>
          When you place an order, we collect your name, email, shipping address, and payment
          information. Payment is processed securely through Shopify — we never store your card
          details.
        </p>
        <p>
          When you sign up for emails or submit a form on the site, we collect your email address
          (and phone, if you give it) along with anything else you choose to share.
        </p>
        <p>
          We use analytics to understand how visitors use the site — anonymized data like page
          views, session length, and general location. No personally identifiable information is
          collected through analytics.
        </p>
      </Section>

      <Rule />

      <Section title="How We Use It">
        <p>
          We use your information to fulfill orders, send shipping confirmations, and answer your
          questions.
        </p>
        <p>
          If you opt into our list, we may send you new drops, restocks, and the occasional
          members-only offer — by email and text. You can unsubscribe anytime.
        </p>
        <p>
          We do not sell, trade, or share your personal information with third parties for their
          marketing purposes.
        </p>
      </Section>

      <Rule />

      <Section title="Cookies">
        <p>
          Our site uses cookies to keep your cart active and to support analytics. By using the
          site you consent to this use. You can disable cookies in your browser settings, though
          some features may not work correctly.
        </p>
      </Section>

      <Rule />

      <Section title="Terms of Service">
        <p>
          By using this site you agree to these terms. We reserve the right to refuse service or
          cancel orders at our discretion.
        </p>
        <p>
          All products are sold as described. Colors may vary slightly from screen to screen due to
          monitor settings.
        </p>
        <p>
          Townies Apparel Co. — which also operates Good Kicks — is not liable for any indirect,
          incidental, or consequential damages arising from use of our products or site.
        </p>
        <p>These terms are governed by the laws of the Commonwealth of Massachusetts.</p>
      </Section>

      <Rule />

      <Section title="Contact">
        <p>
          Questions about privacy or these terms? Reach us on the{' '}
          <Link
            href={supportHref}
            className="text-accent underline underline-offset-4 hover:text-text transition-colors"
          >
            contact page
          </Link>
          .
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-heading uppercase text-xl sm:text-2xl text-text mb-3">{title}</h2>
      <div className="space-y-3 text-muted leading-relaxed">{children}</div>
    </section>
  );
}

function Rule() {
  return <div className="border-t border-rule" />;
}
