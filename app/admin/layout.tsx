'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const navItems = [
  { href: '/admin', label: 'Orders', icon: '📦' },
  { href: '/admin/ambassadors', label: 'Ambassadors', icon: '✌️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') return <>{children}</>;

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-ink">
      {/* Mobile top bar */}
      <div className="md:hidden bg-[#F0EAD9] flex items-center justify-between px-4 py-3 border-b border-brand-rule">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo.png" alt="Good Kicks" width={36} height={36} style={{ height: '36px', width: 'auto' }} />
          <span className="text-brand-muted text-xs uppercase tracking-widest">admin</span>
        </div>
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pathname === item.href ? 'bg-brand-ink text-white' : 'text-brand-ink/60 hover:text-brand-ink'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs text-brand-muted hover:text-brand-ink transition-colors"
          >
            Out
          </button>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop only */}
        <aside className="hidden md:flex w-56 bg-[#F0EAD9] flex-col flex-shrink-0">
          <div className="px-5 py-6 border-b border-brand-rule">
            <Image src="/brand/logo.png" alt="Good Kicks" width={48} height={48} style={{ height: '48px', width: 'auto' }} />
            <p className="text-brand-muted text-xs mt-2 uppercase tracking-widest">admin</p>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-brand-ink text-white' : 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-ink/10'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-3 py-4 border-t border-brand-rule">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-brand-muted hover:text-brand-ink hover:bg-brand-ink/10 transition-colors"
            >
              <span>→</span> Log out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
