// Townies blog — town-pride & Massachusetts culture content.
// Same shape as lib/blog/posts.ts (Good Kicks) but a separate source so the two
// brands never share editorial. The /blog route reads THIS file.

export interface TowniePost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readTime: number;
  tags: string[];
  content: string;
}

export const towniePosts: TowniePost[] = [
  {
    slug: 'zip-codes-are-the-new-area-codes',
    title: 'ZIP Codes Are the New Area Codes',
    description:
      'Why 02186, 02184 and 02043 hit different — and how a five-digit number became the ultimate flex for repping where you’re actually from.',
    publishedAt: '2026-07-20',
    readTime: 4,
    tags: ['town pride', 'zip codes', 'culture'],
    content: `
<p>There was a time when your area code told everyone where you were from. 617 meant Boston. 508 meant you were from out past the city — the South Shore, the SouthCoast, everything Route 24 and 495 touch. 781 was the ring around it. You saw it on a phone and you knew.</p>
<p>Then cell phones happened, people kept their numbers when they moved, and the area code stopped meaning anything. A 617 number now might belong to somebody who's lived in Denver for a decade. The signal got noisy.</p>
<h2>Enter the ZIP</h2>
<p>Your ZIP code can't move with you. <strong>02186 is Milton. Full stop.</strong> 02184 is Braintree. 02043 is Hingham. It's the one number that still means exactly one place, and the people who know, know. Put 02186 on a hat and you're not explaining anything to anybody who matters — you're just confirming it.</p>
<p>That's why we stitch the ZIP on the side panel. Not the front. The front says the town for everybody. The ZIP on the side is for the people who grew up two streets over and clock it from across the bar.</p>
<h2>The insider handshake</h2>
<p>A town name is a statement. A ZIP code is a password. Anyone can buy a hat that says a town. Wearing the ZIP says you know it well enough that the number means something to you — the post office you grew up going to, the return address on every birthday card, the thing you had memorized before your own phone number.</p>
<p>That's the whole idea behind Townies. Rep the town loud on the front. Keep the ZIP for the ones who don't need it explained.</p>
<p><strong>Find your ZIP.</strong> If we haven't done your town yet, tell us — we're working our way across the map, one number at a time.</p>
`,
  },
  {
    slug: 'south-shore-explained',
    title: 'The South Shore, Explained',
    description:
      'Milton to Marshfield, the packies, the exits, the accents. A field guide to the stretch of Massachusetts we started with — and why we started here.',
    publishedAt: '2026-07-14',
    readTime: 5,
    tags: ['south shore', 'massachusetts', 'towns'],
    content: `
<p>People outside Massachusetts hear "South Shore" and picture one place. People from here know it's a dozen towns that would each argue they're nothing like the one next door — and they'd all be a little bit right.</p>
<h2>Where it actually is</h2>
<p>Roughly: south of Boston, hugging the coast from Quincy and Milton down through Weymouth, Hingham, Cohasset, Scituate, Marshfield and Duxbury, with Braintree, Holbrook, Rockland and the rest filling in behind. Bristol County starts bleeding in as you head toward Brockton and beyond. Nobody agrees on the exact borders, which is very on-brand for the region.</p>
<h2>The tells</h2>
<ul>
<li><strong>The packie run.</strong> It's a package store. It is never a "liquor store." If you called it that, you're not from here.</li>
<li><strong>The exit as an identity.</strong> People describe where they live by the exit off the expressway. "I'm off 12." That's a complete address down here.</li>
<li><strong>The accent slides.</strong> It's not the cartoon "pahk the cah" — it's subtler, and it gets stronger the second two people from neighboring towns start arguing about whose is better.</li>
<li><strong>Dunkin' as infrastructure.</strong> Not a coffee shop. A landmark, a meeting point, a unit of measurement. "Two Dunkins past the rotary."</li>
</ul>
<h2>Why we started here</h2>
<p>Because it's ours. You can't make town-pride apparel for a place you don't actually know — the whole thing falls apart the second the details are wrong. We know these towns: the fields, the harbors, the reunions, the exact stretch of road you'd defend to a stranger for no reason. So we started with Milton, Weymouth, Hingham and Braintree, and we're working outward from there.</p>
<p>Don't see your South Shore town yet? It's coming. Or get on the list and tell us to hurry up.</p>
`,
  },
  {
    slug: 'why-hats-first',
    title: 'Why We Do Hats First',
    description:
      'No tees yet, no hoodies yet. Just hats — done right. Here’s the thinking behind starting narrow and what’s actually coming next.',
    publishedAt: '2026-07-08',
    readTime: 3,
    tags: ['behind the brand', 'hats'],
    content: `
<p>We get the question a lot: where are the shirts? The hoodies? The answer is simple — we're not doing them yet, and that's on purpose.</p>
<h2>Do one thing right</h2>
<p>A hat is the most honest piece of apparel you can make. It sits on your head, front and center, every day. There's nowhere to hide a bad blank, sloppy embroidery, or a design that only half-works. If the hat's good, people wear it into the ground. If it's not, it lives in a drawer. We'd rather ship one thing we're proud of than ten things we're not.</p>
<h2>The blank matters</h2>
<p>Our Classic two-tones sit on a soft brushed-cotton-twill workhorse blank — slightly structured, pre-curved brim, broken-in from day one. The ZIP hats run a low-profile unstructured build. We pick the blank for the design, not the other way around. That's the kind of detail that disappears the second you try to do everything at once.</p>
<h2>What's coming</h2>
<p>More towns, first and always — that's the whole map to fill. Beyond that, we'll add pieces when we can do them as well as the hats, and not a minute sooner. When the tees come, they'll be worth the wait. Until then: just hats, done right.</p>
<p>Rep your town. We'll handle the rest of the closet later.</p>
`,
  },
  {
    slug: 'a-guide-to-town-loyalty',
    title: 'A Masshole’s Guide to Town Loyalty',
    description:
      'Why people from Massachusetts will defend a three-square-mile town to the death — and why that’s exactly the point.',
    publishedAt: '2026-07-02',
    readTime: 4,
    tags: ['culture', 'town pride', 'massholes'],
    content: `
<p>Somewhere else in the country, you're from a "greater metro area." You're from "just outside" a bigger city nobody's heard of either. In Massachusetts, you're from a <em>town</em> — a specific one, with a name, a rivalry, and a set of rules you didn't choose but will absolutely enforce.</p>
<h2>The town is the unit</h2>
<p>Ask someone from here where they're from and they won't say "Boston" unless they're actually from Boston. They'll name the town. Then they'll wait to see if you know it. If you do, you're in. If you don't, they'll tell you which exit it's off of and move on with their life.</p>
<h2>The rivalries are sacred</h2>
<p>Neighboring towns are not friends. They are opponents in a game that started before you were born and will continue after you're gone. Thanksgiving football, who has the better beach, whose downtown is "actually nice" — the stakes are nothing and everything at the same time. This is normal. This is healthy. This is Massachusetts.</p>
<h2>Why it matters</h2>
<p>Because loyalty to a small place is one of the last honest things left. You didn't pick your town to look cool. You're loyal to it because it's <em>yours</em> — the streets you know in the dark, the people who'd still recognize you, the version of you that started there. That's not nostalgia. That's identity.</p>
<p>So yeah — we make hats that say the town. Loud. Because the people who get it don't need it explained, and the people who don't were never going to anyway. <strong>Rep your roots.</strong></p>
`,
  },
];

export const getAllTownieSlugs = (): string[] => towniePosts.map((p) => p.slug);

export const getTowniePostBySlug = (slug: string): TowniePost | undefined =>
  towniePosts.find((p) => p.slug === slug);
