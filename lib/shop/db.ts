import 'server-only';
import { randomBytes } from 'node:crypto';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import type { Order, OrderItem, Payout, Product, Reorder, Seller } from './types';

// Reads and writes for the shop_* tables. Service role only; every caller is
// either a public route that validates its own input or an admin route that
// has already checked the session.

export function db() {
  return createSupabaseServiceClient();
}

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as T;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function newToken(): string {
  return randomBytes(24).toString('base64url');
}

// ── Sellers ────────────────────────────────────────────────────────────────

export async function listSellers(opts: { liveOnly?: boolean; includeHouse?: boolean } = {}): Promise<Seller[]> {
  let q = db().from('shop_sellers').select('*').order('sort').order('name');
  if (opts.liveOnly) q = q.eq('status', 'live');
  if (!opts.includeHouse) q = q.eq('kind', 'local');
  return must(await q, 'list sellers') ?? [];
}

export async function getSeller(id: string): Promise<Seller | null> {
  return must(await db().from('shop_sellers').select('*').eq('id', id).maybeSingle(), 'get seller');
}

export async function getSellerBySlug(slug: string): Promise<Seller | null> {
  return must(await db().from('shop_sellers').select('*').eq('slug', slug).maybeSingle(), 'get seller');
}

export async function getSellerByToken(token: string): Promise<Seller | null> {
  if (!token || token.length < 20) return null;
  return must(await db().from('shop_sellers').select('*').eq('invite_token', token).maybeSingle(), 'get seller');
}

export async function getSellerByStripeAccount(acct: string): Promise<Seller | null> {
  return must(await db().from('shop_sellers').select('*').eq('stripe_account_id', acct).maybeSingle(), 'get seller');
}

export async function updateSeller(id: string, patch: Partial<Seller>): Promise<Seller> {
  return must(
    await db().from('shop_sellers').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select('*').single(),
    'update seller',
  );
}

export async function createSeller(row: Partial<Seller> & { name: string }): Promise<Seller> {
  const base = slugify(row.slug || row.name) || 'business';
  // Find a free slug: name, name-2, name-3…
  const { data: taken } = await db().from('shop_sellers').select('slug').like('slug', `${base}%`);
  const used = new Set((taken ?? []).map((r) => r.slug));
  let slug = base;
  for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;
  return must(await db().from('shop_sellers').insert({ ...row, slug }).select('*').single(), 'create seller');
}

// ── Products ───────────────────────────────────────────────────────────────

export async function listProducts(sellerId?: string, opts: { activeOnly?: boolean } = {}): Promise<Product[]> {
  let q = db().from('shop_products').select('*').order('sort').order('created_at');
  if (sellerId) q = q.eq('seller_id', sellerId);
  if (opts.activeOnly) q = q.eq('status', 'active').not('price_cents', 'is', null);
  return must(await q, 'list products') ?? [];
}

export async function getProduct(id: string): Promise<Product | null> {
  return must(await db().from('shop_products').select('*').eq('id', id).maybeSingle(), 'get product');
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  return must(await db().from('shop_products').select('*').in('id', ids), 'get products') ?? [];
}

export async function createProduct(row: Partial<Product> & { seller_id: string; title: string }): Promise<Product> {
  const base = slugify(row.title) || 'hat';
  const { data: taken } = await db().from('shop_products').select('slug').eq('seller_id', row.seller_id);
  const used = new Set((taken ?? []).map((r) => r.slug));
  let slug = base;
  for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;
  return must(await db().from('shop_products').insert({ ...row, slug }).select('*').single(), 'create product');
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<Product> {
  return must(
    await db().from('shop_products').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select('*').single(),
    'update product',
  );
}

export async function adjustStock(productId: string, delta: number): Promise<number | null> {
  const { data, error } = await db().rpc('shop_adjust_stock', { p_product: productId, p_delta: delta });
  if (error) throw new Error(`adjust stock: ${error.message}`);
  return (data as number | null) ?? null;
}

// ── Orders ─────────────────────────────────────────────────────────────────

export async function getOrder(id: string): Promise<Order | null> {
  return must(await db().from('shop_orders').select('*').eq('id', id).maybeSingle(), 'get order');
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  return must(await db().from('shop_order_items').select('*').eq('order_id', orderId), 'order items') ?? [];
}

export async function listOrders(opts: { paidOnly?: boolean } = {}): Promise<Order[]> {
  let q = db().from('shop_orders').select('*').order('created_at', { ascending: false }).limit(500);
  if (opts.paidOnly) q = q.neq('status', 'pending').neq('status', 'canceled');
  return must(await q, 'list orders') ?? [];
}

export async function listOrderItemsFor(orderIds: string[]): Promise<OrderItem[]> {
  if (!orderIds.length) return [];
  return must(await db().from('shop_order_items').select('*').in('order_id', orderIds), 'order items') ?? [];
}

export async function updateOrder(id: string, patch: Partial<Order>): Promise<Order> {
  return must(
    await db().from('shop_orders').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select('*').single(),
    'update order',
  );
}

// ── Payouts ────────────────────────────────────────────────────────────────

export async function listPayouts(filter: { orderId?: string; sellerId?: string; statuses?: Payout['status'][] } = {}): Promise<Payout[]> {
  let q = db().from('shop_payouts').select('*').order('created_at', { ascending: false }).limit(1000);
  if (filter.orderId) q = q.eq('order_id', filter.orderId);
  if (filter.sellerId) q = q.eq('seller_id', filter.sellerId);
  if (filter.statuses) q = q.in('status', filter.statuses);
  return must(await q, 'list payouts') ?? [];
}

export async function updatePayout(id: string, patch: Partial<Payout>): Promise<void> {
  must(await db().from('shop_payouts').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id), 'update payout');
}

// ── Reorders ───────────────────────────────────────────────────────────────

export async function listReorders(status?: Reorder['status']): Promise<Reorder[]> {
  let q = db().from('shop_reorders').select('*').order('requested_at', { ascending: false }).limit(200);
  if (status) q = q.eq('status', status);
  return must(await q, 'list reorders') ?? [];
}
