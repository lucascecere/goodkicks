import { StepsBand } from './steps-band';

/**
 * The bulk-order push, as a StepsBand preset.
 *
 * The three steps are the point. A closing CTA that only says "here is a thing,
 * click it" wastes a section; what actually stops a coach or an office manager
 * is not "can I order thirty of these", it is "how does that work when there's
 * no bulk button on the site". Answering that here is what earns the click.
 *
 * Request-a-town lost its announcement-bar link and its own closing band, which
 * left the footer as its only route in. For a brand whose catalogue is decided
 * by what people ask for, that is too quiet — so it keeps a subordinate line.
 */
export function BulkOrderBand() {
  return (
    <StepsBand
      eyebrow="Bulk orders"
      title="Buying for everybody?"
      body="Teams, companies, schools, fundraisers. Twenty-five hats or two hundred — same twill, same stitching, better price per hat."
      steps={[
        { n: '01', title: 'Tell us the count', body: 'How many, which towns, and the date you need them by.' },
        { n: '02', title: 'We send a price', body: 'A real number and a real lead time, back inside two business days.' },
        { n: '03', title: 'Order by email', body: 'No account, no bulk checkout to fight with. We invoice you.' },
      ]}
      cta={{ href: '/wholesale', label: 'Get a bulk price' }}
      secondary={{ href: '/request-a-town', label: 'Just want one? Request your town' }}
    />
  );
}
