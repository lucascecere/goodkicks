// Repair the Shopify webhook subscriptions on demand.
//
// The daily cron does this on its own; this is the button for when you don't
// want to wait for it, or want to watch it work.

import { NextResponse } from 'next/server';
import { isAdminSession } from '@/lib/admin/require-admin';
import { reconcileWebhooks } from '@/lib/shopify/webhooks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json(await reconcileWebhooks());
}
