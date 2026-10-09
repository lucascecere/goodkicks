import {
  Home,
  Package,
  Receipt,
  Settings,
  Store,
  Megaphone,
  Users,
  BadgeCheck,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import type { AdminIcon } from '@/lib/admin/nav';

const ICONS: Record<AdminIcon | 'more', LucideIcon> = {
  home: Home,
  orders: Receipt,
  products: Package,
  market: Store,
  customers: Users,
  marketing: Megaphone,
  reps: BadgeCheck,
  settings: Settings,
  more: MoreHorizontal,
};

export function NavIcon({ name, className = 'h-[18px] w-[18px]' }: { name: AdminIcon | 'more'; className?: string }) {
  const Icon = ICONS[name];
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
