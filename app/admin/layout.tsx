'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandSwitcher } from '@/components/admin/brand-switcher';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/contacts', label: 'Contacts' },
  { href: '/admin/ambassadors', label: 'Ambassadors' },
  { href: '/admin/campaigns', label: 'Campaigns' },
  { href: '/admin/settings', label: 'Settings' },
];

const mobileNavItems = navItems.filter((i) => i.href !== '/admin/settings');

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') return <>{children}</>;

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#1A1A1A]" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Mobile top bar */}
      <div className="md:hidden bg-[#F0EAD9] border-b border-[#D9D2C2]">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-[#1A1A1A] text-base font-bold tracking-tight leading-none">Store Admin</p>
            <p className="text-[#6B6B6B] text-[9px] mt-1 uppercase tracking-[0.18em]">Townies · Good Kicks</p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/admin/settings"
              className={`p-2 rounded-lg transition-colors ${pathname.startsWith('/admin/settings') ? 'bg-[#1A1A1A] text-white' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'}`}
              aria-label="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
        <div className="flex border-t border-[#D9D2C2]">
          {mobileNavItems.map((item) => {
            const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 text-center py-2.5 text-xs font-medium transition-colors ${
                  active ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-[#D9D2C2]">
          <BrandSwitcher />
        </div>
      </div>

      {/* Desktop layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 bg-[#F0EAD9] flex-col flex-shrink-0">
          <div className="px-5 py-6 border-b border-[#D9D2C2]">
            <p className="text-[#1A1A1A] text-lg font-bold tracking-tight leading-none">Store Admin</p>
            <p className="text-[#6B6B6B] text-[10px] mt-1.5 uppercase tracking-[0.2em]">Townies · Good Kicks</p>
            <div className="mt-4">
              <BrandSwitcher />
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/10'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-3 py-4 border-t border-[#D9D2C2]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/10 transition-colors"
            >
              <span>→</span> Log out
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
