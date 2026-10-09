'use client';

import { useEffect } from 'react';
import { clearBag } from '@/lib/shop/bag';

/** Empty the market bag once, after a successful checkout. */
export function ClearBagOnThanks() {
  useEffect(() => clearBag(), []);
  return null;
}
