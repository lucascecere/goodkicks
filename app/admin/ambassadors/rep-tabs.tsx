'use client';

import Link from 'next/link';

// Sub-navigation within the reps section. Kept here rather than in the admin
// sidebar so the top-level nav stays at five items.
const TABS = [
  { key: 'roster', label: 'Roster', href: '/admin/ambassadors' },
  { key: 'sales', label: 'Sales', href: '/admin/ambassadors/sales' },
] as const;

export function RepTabs({ active }: { active: 'roster' | 'sales' }) {
  return (
    <div className="mb-5 flex gap-1.5">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`whitespace-nowrap rounded-full px-3.5 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
            active === tab.key
              ? 'bg-town-cream text-town-navy'
              : 'border border-town-cream/15 text-town-cream/60 hover:text-town-cream'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
