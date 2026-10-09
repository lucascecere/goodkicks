// The admin's navigation, as data.
//
// Eight top-level sections. A section with `children` opens to show them while
// you're inside it. `match` lists the extra paths that count as "inside" a
// section, so the existing page URLs (/admin/contacts, /admin/ambassadors, …)
// keep working and still light up the right tab.
//
// `mobile` marks the four sections on the phone's bottom tab bar; everything
// else sits behind its "More" tab.

export type AdminNavChild = { href: string; label: string };

export type AdminNavItem = {
  href: string;
  label: string;
  icon: AdminIcon;
  match?: string[];
  children?: AdminNavChild[];
  mobile?: boolean;
};

export type AdminIcon =
  | 'home'
  | 'orders'
  | 'products'
  | 'market'
  | 'customers'
  | 'marketing'
  | 'reps'
  | 'settings';

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Home', icon: 'home', mobile: true },
  { href: '/admin/orders', label: 'Orders', icon: 'orders', mobile: true },
  { href: '/admin/products', label: 'Products', icon: 'products', mobile: true },
  {
    href: '/admin/market',
    label: 'Market',
    icon: 'market',
    mobile: true,
    children: [
      { href: '/admin/market', label: 'Businesses' },
      { href: '/admin/market/payouts', label: 'Payouts' },
      { href: '/admin/market/reorders', label: 'Reorders' },
    ],
  },
  { href: '/admin/contacts', label: 'Customers', icon: 'customers' },
  {
    href: '/admin/campaigns',
    label: 'Marketing',
    icon: 'marketing',
    match: ['/admin/campaigns', '/admin/reviews', '/admin/studio', '/admin/codes'],
    // /admin/codes is built but unlisted: Shopify stays the store for now.
    children: [
      { href: '/admin/campaigns', label: 'Campaigns' },
      { href: '/admin/reviews', label: 'Reviews' },
      { href: '/admin/studio', label: 'Studio' },
    ],
  },
  {
    href: '/admin/ambassadors',
    label: 'Reps',
    icon: 'reps',
    children: [
      { href: '/admin/ambassadors', label: 'Reps' },
      { href: '/admin/ambassadors/sales', label: 'Sales & partners' },
    ],
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: 'settings',
    match: ['/admin/settings', '/admin/integrations'],
    children: [
      { href: '/admin/settings', label: 'Settings' },
      { href: '/admin/integrations', label: 'Integrations' },
    ],
  },
];

/** Is `pathname` inside this section? Home only matches itself. */
export function isActive(item: AdminNavItem, pathname: string): boolean {
  if (item.href === '/admin') return pathname === '/admin';
  const roots = item.match ?? [item.href];
  return roots.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/** The child link to highlight: the longest href the path sits under. */
export function activeChild(item: AdminNavItem, pathname: string): string | null {
  const hits = (item.children ?? []).filter(
    (c) => pathname === c.href || pathname.startsWith(`${c.href}/`),
  );
  hits.sort((a, b) => b.href.length - a.href.length);
  return hits[0]?.href ?? null;
}
