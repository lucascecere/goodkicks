'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  type AdminBrand,
  ADMIN_BRAND_COOKIE,
  BRAND_LABELS,
  normalizeBrand,
} from '@/lib/admin/brand';

const OPTIONS: AdminBrand[] = ['all', 'townies', 'goodkicks'];

// Global brand filter for the admin. Writes a cookie + router.refresh() so the
// server components (dashboard, etc.) re-render scoped to the chosen brand.
// Initial active state syncs from the cookie after mount to avoid an SSR/client
// hydration mismatch (the layout is a client component with no server cookie).
export function BrandSwitcher() {
  const router = useRouter();
  const [brand, setBrand] = useState<AdminBrand>('all');
  const [, startTransition] = useTransition();

  useEffect(() => {
    const match = document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${ADMIN_BRAND_COOKIE}=`));
    if (match) setBrand(normalizeBrand(match.split('=')[1]));
  }, []);

  function pick(next: AdminBrand) {
    if (next === brand) return;
    setBrand(next);
    document.cookie = `${ADMIN_BRAND_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex rounded-lg bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 p-0.5">
      {OPTIONS.map((option) => {
        const active = option === brand;
        return (
          <button
            key={option}
            type="button"
            onClick={() => pick(option)}
            className={`flex-1 whitespace-nowrap rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${
              active
                ? 'bg-[#1A1A1A] text-white shadow-sm'
                : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
            }`}
          >
            {option === 'all' ? 'All' : BRAND_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
