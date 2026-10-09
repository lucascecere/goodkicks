'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, X } from 'lucide-react';
import { BrandSwitcher } from '@/components/admin/brand-switcher';
import { NavIcon } from '@/components/admin/nav-icon';
import { ADMIN_NAV, activeChild, isActive } from '@/lib/admin/nav';

// The Townies back office.
//
// Desktop: a navy sidebar with the eight sections; a section with children
// opens while you're inside it. Phones: a slim top bar and a bottom tab bar
// (Home · Orders · Products · Market · More), because thumbs live at the bottom
// of the screen and almost all of the day-to-day work is orders.

const LOGO = '/brand/logos/townies-script-natural.svg';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the More sheet whenever the page changes.
  useEffect(() => setMoreOpen(false), [pathname]);

  if (pathname === '/admin/login') return <>{children}</>;

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  }

  const mobileTabs = ADMIN_NAV.filter((i) => i.mobile);
  const moreItems = ADMIN_NAV.filter((i) => !i.mobile);
  const moreActive = moreItems.some((i) => isActive(i, pathname));
  const section = ADMIN_NAV.find((i) => isActive(i, pathname));

  return (
    <div className="min-h-screen bg-town-navy font-body text-town-cream">
      {/* ── Phone top bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-town-cream/10 bg-[#0A1520]/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link href="/admin" className="flex items-center gap-2.5" aria-label="Admin home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="Townies" className="h-8 w-auto" />
            <span className="admin-eyebrow">Admin</span>
          </Link>
          <div className="w-44">
            <BrandSwitcher />
          </div>
        </div>
        {/* A section's own sub-pages, as a scrollable strip under the bar. */}
        {section?.children && (
          <div className="flex gap-1 overflow-x-auto border-t border-town-cream/10 px-3 py-2">
            {section.children.map((c) => {
              const on = activeChild(section, pathname) === c.href;
              return (
                <Link
                  key={c.href}
                  href={c.href}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 font-label text-[11px] font-semibold uppercase tracking-[0.12em] ${
                    on ? 'bg-town-cream text-town-navy' : 'text-town-cream/55'
                  }`}
                >
                  {c.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex">
        {/* ── Desktop sidebar ────────────────────────────────────────── */}
        <aside className="sticky top-0 hidden h-screen w-60 flex-shrink-0 flex-col border-r border-town-cream/10 bg-[#0A1520] md:flex">
          <div className="border-b border-town-cream/10 px-5 pb-5 pt-6">
            <Link href="/admin" className="block" aria-label="Admin home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="Townies" className="h-11 w-auto" />
            </Link>
            <p className="admin-eyebrow mt-2">Back office</p>
            <div className="mt-4">
              <BrandSwitcher />
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
            {ADMIN_NAV.map((item) => {
              const on = isActive(item, pathname);
              const child = on ? activeChild(item, pathname) : null;
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-label text-[13px] font-semibold tracking-wide transition-colors ${
                      on
                        ? 'bg-town-cream text-town-navy'
                        : 'text-town-cream/60 hover:bg-town-cream/[0.06] hover:text-town-cream'
                    }`}
                  >
                    <NavIcon name={item.icon} />
                    {item.label}
                  </Link>
                  {on && item.children && (
                    <div className="mb-1 ml-[22px] mt-1 space-y-0.5 border-l border-town-cream/15 pl-3">
                      {item.children.map((c) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          className={`block rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                            child === c.href ? 'text-town-cream' : 'text-town-cream/45 hover:text-town-cream'
                          }`}
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="border-t border-town-cream/10 px-3 py-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-label text-[13px] font-semibold text-town-cream/50 transition-colors hover:bg-town-cream/[0.06] hover:text-town-cream"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} /> Log out
            </button>
          </div>
        </aside>

        {/* ── Page ───────────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1 pb-24 md:pb-0">{children}</main>
      </div>

      {/* ── Phone bottom tabs ────────────────────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-town-cream/10 bg-[#0A1520]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Admin sections"
      >
        {mobileTabs.map((item) => {
          const on = isActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2.5 font-label text-[10px] font-semibold uppercase tracking-[0.1em] ${
                on ? 'text-town-cream' : 'text-town-cream/45'
              }`}
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex flex-col items-center gap-1 py-2.5 font-label text-[10px] font-semibold uppercase tracking-[0.1em] ${
            moreActive ? 'text-town-cream' : 'text-town-cream/45'
          }`}
        >
          <NavIcon name="more" className="h-5 w-5" />
          More
        </button>
      </nav>

      {/* ── Phone "More" sheet ───────────────────────────────────────── */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-town-cream/10 bg-[#0A1520] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="admin-eyebrow">More</p>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close" className="p-1 text-town-cream/60">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              {moreItems.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 font-label text-sm font-semibold ${
                      isActive(item, pathname) ? 'bg-town-cream text-town-navy' : 'text-town-cream/80'
                    }`}
                  >
                    <NavIcon name={item.icon} />
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="ml-11 flex flex-wrap gap-x-4 gap-y-1 pb-1">
                      {item.children.map((c) => (
                        <Link key={c.href} href={c.href} className="py-1 text-xs text-town-cream/50">
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-label text-sm font-semibold text-town-cream/50"
              >
                <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} /> Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
