'use client';

import { useEffect } from 'react';
import { captureFirstTouch } from '@/lib/attribution';

/** Records where the shopper came from, once, on their first page. */
export function FirstTouch() {
  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) captureFirstTouch();
  }, []);
  return null;
}
