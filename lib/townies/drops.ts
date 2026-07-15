// The current live drop — featured on the homepage + as the /south-shore preview
// until the Shopify products go live. Photos are real lifestyle shots of each
// town's hat, shot in that town's downtown.

export type Drop = { town: string; image: string; alt: string };

export const CURRENT_DROP: Drop[] = [
  {
    town: 'Milton',
    image: '/brand/drops/milton.jpg',
    alt: 'Townies Milton, Massachusetts hats in downtown Milton',
  },
  {
    town: 'Braintree',
    image: '/brand/drops/braintree.jpg',
    alt: 'Townies Braintree, Massachusetts hats in downtown Braintree',
  },
];
