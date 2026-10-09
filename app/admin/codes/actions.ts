'use server';

import { revalidatePath } from 'next/cache';
import { isAdminSession } from '@/lib/admin/require-admin';
import { db } from '@/lib/shop/db';
import { normalizeCode } from '@/lib/shop/discounts';
import { importShopifyDiscounts } from '@/lib/shop/import-discounts';

type Result = { ok: true; message?: string } | { ok: false; error: string };

async function run(fn: () => Promise<string | void>): Promise<Result> {
  try {
    if (!(await isAdminSession())) throw new Error('Not signed in.');
    const message = await fn();
    revalidatePath('/admin/codes');
    return { ok: true, message: message || undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Something went wrong.' };
  }
}

export async function createCodeAction(fd: FormData): Promise<Result> {
  return run(async () => {
    const code = normalizeCode(String(fd.get('code') ?? ''));
    if (!/^[A-Z0-9-]{3,40}$/.test(code)) throw new Error('Codes are 3 to 40 letters, numbers or dashes.');
    const kind = String(fd.get('kind'));
    if (!['percent', 'fixed', 'free_shipping'].includes(kind)) throw new Error('Pick a type.');
    const raw = parseFloat(String(fd.get('value') ?? '0')) || 0;
    const value = kind === 'percent' ? Math.round(raw) : kind === 'fixed' ? Math.round(raw * 100) : 0;
    if (kind === 'percent' && (value < 1 || value > 100)) throw new Error('Percent must be 1 to 100.');
    if (kind === 'fixed' && value < 1) throw new Error('Enter how many dollars off.');
    const limit = parseInt(String(fd.get('usage_limit') ?? ''), 10);
    const ends = String(fd.get('ends_at') ?? '');
    const min = parseFloat(String(fd.get('min') ?? '0')) || 0;
    const { error } = await db().from('shop_discounts').insert({
      code,
      kind,
      value,
      scope: ['all', 'hats', 'foot_bags'].includes(String(fd.get('scope'))) ? String(fd.get('scope')) : 'all',
      min_subtotal_cents: Math.round(min * 100),
      usage_limit: Number.isFinite(limit) && limit > 0 ? limit : null,
      ends_at: ends ? new Date(`${ends}T23:59:59-05:00`).toISOString() : null,
      note: String(fd.get('note') ?? '').trim() || null,
      source: 'manual',
    });
    if (error) throw new Error(/duplicate/i.test(error.message) ? 'That code already exists.' : error.message);
    return `${code} created.`;
  });
}

export async function setCodeActiveAction(id: string, active: boolean): Promise<Result> {
  return run(async () => {
    await db().from('shop_discounts').update({ active, updated_at: new Date().toISOString() }).eq('id', id);
  });
}

export async function importCodesAction(): Promise<Result> {
  return run(async () => {
    const r = await importShopifyDiscounts();
    return `Copied from Shopify: ${r.created} new, ${r.updated} refreshed. Nothing in Shopify changed.`;
  });
}
