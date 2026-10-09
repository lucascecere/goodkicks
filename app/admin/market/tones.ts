import type { BadgeTone } from '@/components/admin/ui';
import type { Fulfillment, PayoutStatus, SellerStatus } from '@/lib/shop/types';

export const STATUS_TONE: Record<SellerStatus, BadgeTone> = {
  applied: 'info',
  approved: 'warn',
  live: 'good',
  paused: 'neutral',
  rejected: 'bad',
};

export const PAYOUT_TONE: Record<PayoutStatus, BadgeTone> = {
  held: 'neutral',
  due: 'warn',
  transferred: 'good',
  reversed: 'bad',
  canceled: 'neutral',
};

export const FULFILL_TONE: Record<Fulfillment, BadgeTone> = {
  unfulfilled: 'warn',
  needs_production: 'bad',
  ready_for_pickup: 'info',
  picked_up: 'good',
  shipped: 'good',
  delivered: 'good',
  canceled: 'neutral',
};
