'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isAdminSession } from '@/lib/admin/require-admin';
import {
  adjustStock,
  createProduct,
  createSeller,
  db,
  getOrder,
  getOrderItems,
  getProduct,
  getSeller,
  newToken,
  updateOrder,
  updateProduct,
  updateSeller,
} from '@/lib/shop/db';
import { getShopStripe, shopStripeConfigured } from '@/lib/shop/config';
import { refreshPayoutStatus, expressDashboardLink } from '@/lib/shop/connect';
import { sendReadyForPickupEmail, sendReorderRequest, sendSellerInvite, sendShippedEmail } from '@/lib/shop/email';
import { minPriceCents, WHOLESALE_CENTS, type WholesaleType } from '@/lib/shop/money';
import { startPayoutClock, transferPayout } from '@/lib/shop/payouts';
import { buyLabel, registerTracking, shippoConfigured } from '@/lib/shop/shippo';
import { queueMarketReview } from '@/lib/shop/reviews';
import { importShopifyCatalog } from '@/lib/shop/import-shopify';
import type { SellerStatus } from '@/lib/shop/types';

// Every admin write for the market and our own orders. Middleware already
// gates /admin, but a server action is a POST anyone could aim at, so each one
// re-checks the session first.

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function guard() {
  if (!(await isAdminSession())) throw new Error('Not signed in.');
}

function str(fd: FormData, k: string): string {
  return String(fd.get(k) ?? '').trim();
}

function cents(v: string): number | null {
  if (!v) return null;
  const n = Math.round(parseFloat(v.replace(/[^0-9.]/g, '')) * 100);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function wrap(fn: () => Promise<string | void>): Promise<ActionResult> {
  try {
    await guard();
    const message = await fn();
    return { ok: true, message: message || undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Something went wrong.' };
  }
}

async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('That file is not an image.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Images must be under 8 MB.');
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await db().storage.from('shop').upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return db().storage.from('shop').getPublicUrl(path).data.publicUrl;
}

function file(fd: FormData, k: string): File | null {
  const f = fd.get(k);
  return f instanceof File && f.size > 0 ? f : null;
}

// ── Sellers ────────────────────────────────────────────────────────────────

export async function createSellerAction(fd: FormData) {
  await guard();
  const name = str(fd, 'name');
  if (!name) throw new Error('Name is required.');
  const logo = file(fd, 'logo');
  const cover = file(fd, 'cover');
  const seller = await createSeller({
    name,
    town: str(fd, 'town') || null,
    blurb: str(fd, 'blurb') || null,
    contact_name: str(fd, 'contact_name') || null,
    contact_email: str(fd, 'contact_email').toLowerCase() || null,
    contact_phone: str(fd, 'contact_phone') || null,
    is_royalbacks_sourced: fd.get('is_royalbacks_sourced') === 'on',
    source_type: 'hat_client',
    status: 'approved',
    invite_token: newToken(),
  });
  if (logo) await updateSeller(seller.id, { logo_url: await uploadImage(logo, `logos/${seller.id}`) });
  if (cover) await updateSeller(seller.id, { cover_url: await uploadImage(cover, `covers/${seller.id}`) });
  revalidatePath('/admin/market');
  redirect(`/admin/market/sellers/${seller.id}`);
}

export async function updateSellerAction(id: string, fd: FormData): Promise<ActionResult> {
  return wrap(async () => {
    const logo = file(fd, 'logo');
    const cover = file(fd, 'cover');
    if (!str(fd, 'name')) throw new Error('The business needs a name.');
    await updateSeller(id, {
      name: str(fd, 'name'),
      town: str(fd, 'town') || null,
      blurb: str(fd, 'blurb') || null,
      contact_name: str(fd, 'contact_name') || null,
      contact_email: str(fd, 'contact_email').toLowerCase() || null,
      contact_phone: str(fd, 'contact_phone') || null,
      website: str(fd, 'website') || null,
      instagram: str(fd, 'instagram') || null,
      pickup_enabled: fd.get('pickup_enabled') === 'on',
      pickup_address: str(fd, 'pickup_address') || null,
      pickup_notes: str(fd, 'pickup_notes') || null,
      is_royalbacks_sourced: fd.get('is_royalbacks_sourced') === 'on',
      sort: parseInt(str(fd, 'sort') || '0', 10) || 0,
      ...(logo ? { logo_url: await uploadImage(logo, `logos/${id}`) } : {}),
      ...(cover ? { cover_url: await uploadImage(cover, `covers/${id}`) } : {}),
      ...(fd.get('remove_cover') === 'on' ? { cover_url: null } : {}),
    });
    revalidatePath(`/admin/market/sellers/${id}`);
    revalidatePath('/local');
    return 'Saved.';
  });
}

export async function setSellerStatusAction(id: string, status: SellerStatus): Promise<ActionResult> {
  return wrap(async () => {
    const seller = await getSeller(id);
    if (!seller) throw new Error('Business not found.');
    const patch: Parameters<typeof updateSeller>[1] = { status };
    // Approving an applicant gives them a join link.
    if ((status === 'approved' || status === 'live') && !seller.invite_token) patch.invite_token = newToken();
    await updateSeller(id, patch);
    revalidatePath(`/admin/market/sellers/${id}`);
    revalidatePath('/admin/market');
    revalidatePath('/local');
    return status === 'live' ? 'The shop is open.' : `Marked ${status}.`;
  });
}

export async function sendInviteAction(id: string): Promise<ActionResult> {
  return wrap(async () => {
    let seller = await getSeller(id);
    if (!seller) throw new Error('Business not found.');
    if (!seller.invite_token) seller = await updateSeller(id, { invite_token: newToken() });
    await sendSellerInvite(seller);
    await updateSeller(id, { invited_at: new Date().toISOString() });
    revalidatePath(`/admin/market/sellers/${id}`);
    return `Invite sent to ${seller.contact_email}.`;
  });
}

export async function refreshStripeAction(id: string): Promise<ActionResult> {
  return wrap(async () => {
    const seller = await getSeller(id);
    if (!seller) throw new Error('Business not found.');
    const ok = await refreshPayoutStatus(seller);
    revalidatePath(`/admin/market/sellers/${id}`);
    return ok ? 'Payouts are on.' : 'Not finished yet on Stripe.';
  });
}

export async function stripeDashboardAction(id: string): Promise<ActionResult> {
  return wrap(async () => {
    const seller = await getSeller(id);
    if (!seller?.stripe_account_id) throw new Error('No Stripe account yet.');
    return expressDashboardLink(seller.stripe_account_id);
  });
}

// ── Products ───────────────────────────────────────────────────────────────

export async function addProductAction(sellerId: string, fd: FormData): Promise<ActionResult> {
  return wrap(async () => {
    const title = str(fd, 'title');
    if (!title) throw new Error('Give the hat a name.');
    const type = (str(fd, 'wholesale_type') === 'lifestyle' ? 'lifestyle' : 'everyday') as WholesaleType;
    const image = file(fd, 'image');
    await createProduct({
      seller_id: sellerId,
      title,
      description: str(fd, 'description') || null,
      wholesale_type: type,
      wholesale_cents: WHOLESALE_CENTS[type],
      on_hand: parseInt(str(fd, 'on_hand') || '0', 10) || 0,
      status: 'draft',
      image_url: image ? await uploadImage(image, `hats/${sellerId}`) : null,
    });
    revalidatePath(`/admin/market/sellers/${sellerId}`);
    return 'Hat added. The business sets its price on their join link.';
  });
}

export async function updateProductAction(id: string, fd: FormData): Promise<ActionResult> {
  return wrap(async () => {
    const p = await getProduct(id);
    if (!p) throw new Error('Hat not found.');
    const type = (str(fd, 'wholesale_type') === 'lifestyle' ? 'lifestyle' : 'everyday') as WholesaleType;
    const wholesale = WHOLESALE_CENTS[type];
    const price = cents(str(fd, 'price'));
    const status = (['draft', 'active', 'archived'].includes(str(fd, 'status')) ? str(fd, 'status') : p.status) as typeof p.status;
    if (status === 'active' && (!price || price < minPriceCents(wholesale))) {
      throw new Error(`To sell it, the price must be at least $${(minPriceCents(wholesale) / 100).toFixed(2)}.`);
    }
    const image = file(fd, 'image');
    await updateProduct(id, {
      title: str(fd, 'title') || p.title,
      description: str(fd, 'description') || null,
      wholesale_type: type,
      wholesale_cents: wholesale,
      price_cents: price,
      status,
      on_hand: Number.isFinite(parseInt(str(fd, 'on_hand'), 10)) ? parseInt(str(fd, 'on_hand'), 10) : p.on_hand,
      stock_buffer: Math.max(0, Number.isFinite(parseInt(str(fd, 'stock_buffer'), 10)) ? parseInt(str(fd, 'stock_buffer'), 10) : p.stock_buffer),
      ...(image ? { image_url: await uploadImage(image, `hats/${p.seller_id}`) } : {}),
    });
    revalidatePath(`/admin/market/sellers/${p.seller_id}`);
    revalidatePath('/local');
    return 'Saved.';
  });
}

// ── Reorders ───────────────────────────────────────────────────────────────

export async function reorderAction(productId: string, fd: FormData): Promise<ActionResult> {
  return wrap(async () => {
    const p = await getProduct(productId);
    if (!p) throw new Error('Hat not found.');
    const seller = await getSeller(p.seller_id);
    if (!seller) throw new Error('Business not found.');
    const qty = parseInt(str(fd, 'qty'), 10) || Math.max(1, p.stock_buffer - p.on_hand);
    const note = str(fd, 'note') || null;
    await sendReorderRequest(p, seller, qty, note);
    await db().from('shop_reorders').insert({ product_id: p.id, qty, note });
    revalidatePath('/admin/market');
    revalidatePath('/admin/market/reorders');
    return `Asked RoyalBacks for ${qty}.`;
  });
}

export async function receiveReorderAction(reorderId: string): Promise<ActionResult> {
  return wrap(async () => {
    const { data: r } = await db().from('shop_reorders').update({ status: 'received', received_at: new Date().toISOString() }).eq('id', reorderId).eq('status', 'requested').select('*').maybeSingle();
    if (!r) return 'Already received.';
    await adjustStock(r.product_id, r.qty);
    revalidatePath('/admin/market');
    revalidatePath('/admin/market/reorders');
    return `Added ${r.qty} to stock.`;
  });
}

export async function cancelReorderAction(reorderId: string): Promise<ActionResult> {
  return wrap(async () => {
    await db().from('shop_reorders').update({ status: 'canceled' }).eq('id', reorderId).eq('status', 'requested');
    revalidatePath('/admin/market/reorders');
  });
}

// ── Orders ─────────────────────────────────────────────────────────────────

function orderPaths(id: string) {
  revalidatePath(`/admin/orders/m-${id}`);
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
}

export async function buyLabelAction(orderId: string): Promise<ActionResult> {
  return wrap(async () => {
    const o = await getOrder(orderId);
    if (!o || o.status !== 'paid') throw new Error('Only paid orders can ship.');
    if (o.delivery !== 'ship' || !o.shipping_address) throw new Error('This order has no shipping address.');
    if (o.label_url) return 'A label already exists.';
    const items = await getOrderItems(o.id);
    const label = await buyLabel({
      to: o.shipping_address,
      email: o.buyer_email,
      phone: o.buyer_phone,
      hatCount: items.reduce((n, i) => n + i.qty, 0),
      orderNumber: o.number,
    });
    await updateOrder(o.id, {
      label_url: label.labelUrl,
      tracking_number: label.trackingNumber,
      tracking_url: label.trackingUrl,
      carrier: `${label.carrier} ${label.service}`,
      label_cost_cents: label.costCents,
      shippo_transaction_id: label.transactionId,
    });
    orderPaths(o.id);
    return `Label bought: $${(label.costCents / 100).toFixed(2)}. Print it, then mark shipped.`;
  });
}

export async function markShippedAction(orderId: string, fd: FormData): Promise<ActionResult> {
  return wrap(async () => {
    const o = await getOrder(orderId);
    if (!o || o.status !== 'paid') throw new Error('Only paid orders can ship.');
    const tracking = str(fd, 'tracking') || o.tracking_number;
    const now = new Date();
    const updated = await updateOrder(o.id, {
      fulfillment: 'shipped',
      handed_over_at: now.toISOString(),
      tracking_number: tracking || null,
      tracking_url: o.tracking_url ?? (tracking ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(tracking)}` : null),
      carrier: o.carrier ?? (tracking ? 'USPS' : null),
    });
    await startPayoutClock(o.id, now);
    // A label bought through Shippo is already tracked; a hand-entered number
    // has to be registered so the "delivered" update still arrives.
    if (tracking && !o.shippo_transaction_id && shippoConfigured()) {
      try {
        await registerTracking('usps', tracking);
      } catch (err) {
        console.error('[shop] tracking register', err);
      }
    }
    // No tracking means no delivery scan: ask for the review on a timer.
    if (!tracking) await queueMarketReview(updated, 'no-scan', now);
    try {
      await sendShippedEmail(updated);
    } catch (err) {
      console.error('[shop] shipped email', err);
    }
    orderPaths(o.id);
    return 'Marked shipped. The buyer has their tracking.';
  });
}

export async function setFulfillmentAction(orderId: string, step: 'unfulfilled' | 'needs_production' | 'ready_for_pickup' | 'picked_up'): Promise<ActionResult> {
  return wrap(async () => {
    const o = await getOrder(orderId);
    if (!o || o.status !== 'paid') throw new Error('Only paid orders can move.');
    const patch: Parameters<typeof updateOrder>[1] = { fulfillment: step };
    if (step === 'picked_up') patch.handed_over_at = new Date().toISOString();
    const updated = await updateOrder(o.id, patch);
    if (step === 'picked_up') {
      await startPayoutClock(o.id);
      await queueMarketReview(updated, 'picked_up');
    }
    if (step === 'ready_for_pickup' && o.pickup_seller_id) {
      const s = await getSeller(o.pickup_seller_id);
      if (s) {
        try {
          await sendReadyForPickupEmail(updated, s);
        } catch (err) {
          console.error('[shop] pickup email', err);
        }
      }
    }
    orderPaths(o.id);
    return step === 'ready_for_pickup' ? 'Buyer emailed: ready for pickup.' : 'Updated.';
  });
}

export async function refundOrderAction(orderId: string): Promise<ActionResult> {
  return wrap(async () => {
    if (!shopStripeConfigured()) throw new Error('Stripe is not connected.');
    const o = await getOrder(orderId);
    if (!o?.stripe_payment_intent_id) throw new Error('This order has no payment to refund.');
    if (o.status === 'refunded') return 'Already refunded.';
    // The charge.refunded webhook does the rest: status, payouts, stock.
    await getShopStripe().refunds.create({ payment_intent: o.stripe_payment_intent_id }, { idempotencyKey: `refund_${o.id}` });
    orderPaths(o.id);
    return 'Refund sent. It shows on their card in 5 to 10 days.';
  });
}

// ── Payouts ────────────────────────────────────────────────────────────────

export async function transferNowAction(payoutId: string): Promise<ActionResult> {
  return wrap(async () => {
    const { data: p } = await db().from('shop_payouts').select('*').eq('id', payoutId).maybeSingle();
    if (!p) throw new Error('Payout not found.');
    if (p.status === 'transferred') return 'Already sent.';
    const err = await transferPayout(p);
    revalidatePath('/admin/market/payouts');
    if (err) throw new Error(err);
    return 'Sent.';
  });
}

// ── Catalog ────────────────────────────────────────────────────────────────

export async function importShopifyAction(): Promise<ActionResult> {
  return wrap(async () => {
    const r = await importShopifyCatalog();
    revalidatePath('/admin/products');
    return `Copied from Shopify: ${r.created} new, ${r.updated} refreshed${r.skipped.length ? `, skipped ${r.skipped.join(', ')}` : ''}. Nothing in Shopify changed.`;
  });
}
