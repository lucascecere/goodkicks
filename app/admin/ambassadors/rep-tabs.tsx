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
    <div className="flex gap-1.5 pb-3">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            active === tab.key
              ? 'bg-white text-[#1A1A1A]'
              : 'bg-white/8 text-white/50 hover:text-white hover:bg-white/12'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
