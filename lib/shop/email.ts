import 'server-only';
import { sendEmail } from '@/lib/email/resend-client';
import { absoluteUrl, MARKET_BASE, notifyEmail, royalbacksEmail, SHOP_FROM, SHOP_REPLY_TO, siteUrl } from './config';
import { dollars } from './money';
import type { Order, OrderItem, Product, Seller } from './types';

// Every email the shop sends. All Townies-branded, all from the Townies
// address (never a YWF mailbox), plain layout that reads fine in any client.

const NAVY = '#0D1B2A';
const FOREST = '#2F4F3A';
const CREAM = '#F2EFE8';

function esc(s: string | null | undefined): string {
  return (s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function layout({ heading, body, cta }: { heading: string; body: string; cta?: { href: string; label: string } }): string {
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px 0;"><tr><td style="background:${FOREST};border-radius:2px;">
        <a href="${cta.href}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;">${esc(cta.label)}</a>
      </td></tr></table>`
    : '';
  return `<!doctype html><html><body style="margin:0;padding:0;background:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:32px 16px;"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:4px;overflow:hidden;">
    <tr><td style="background:${NAVY};padding:20px 28px;"><span style="color:#ffffff;font-size:15px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">TOWNIES</span></td></tr>
    <tr><td style="padding:30px 28px 10px 28px;color:${NAVY};font-size:15px;line-height:1.6;">
      <p style="margin:0 0 16px 0;font-size:20px;font-weight:700;">${esc(heading)}</p>
      ${body}
      ${button}
    </td></tr>
    <tr><td style="padding:18px 28px 26px 28px;"><p style="margin:0;font-size:12px;line-height:1.6;color:#8F918D;border-top:1px solid #E0DCD2;padding-top:14px;">
      Townies · <a href="${siteUrl()}" style="color:#8F918D;">townies.shop</a> · reply to this email with any question
    </p></td></tr>
  </table>
</td></tr></table></body></html>`;
}

function itemsTable(items: OrderItem[]): string {
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #EEE;">${esc(i.title)}${i.qty > 1 ? ` <span style="color:#5C6168;">×${i.qty}</span>` : ''}</td>
        <td style="padding:8px 0;border-bottom:1px solid #EEE;text-align:right;white-space:nowrap;">${dollars(i.unit_price_cents * i.qty)}</td>
      </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:8px 0 4px 0;">${rows}</table>`;
}

function totals(o: Order): string {
  const line = (label: string, cents: number, bold = false) =>
    `<tr><td style="padding:3px 0;color:#5C6168;${bold ? 'font-weight:700;color:#0D1B2A;' : ''}">${label}</td><td style="padding:3px 0;text-align:right;${bold ? 'font-weight:700;' : ''}">${dollars(cents)}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:6px;">
    ${line('Subtotal', o.subtotal_cents)}
    ${line(o.delivery === 'pickup' ? 'Pickup' : 'Shipping', o.shipping_cents)}
    ${line('Tax', o.tax_cents)}
    ${line('Total', o.total_cents, true)}
  </table>`;
}

const orderUrl = (o: Order) => `${siteUrl()}${MARKET_BASE}/order/${o.id}`;

// ── Buyer ──────────────────────────────────────────────────────────────────

export async function sendOrderReceipt(o: Order, items: OrderItem[], pickupAt: Seller | null) {
  if (!o.buyer_email) return;
  const first = o.buyer_name?.split(' ')[0] || 'Hey';
  const how =
    o.delivery === 'pickup' && pickupAt
      ? `<p style="margin:0 0 12px 0;">You chose pickup at <strong>${esc(pickupAt.name)}</strong>${pickupAt.pickup_address ? `, ${esc(pickupAt.pickup_address)}` : ''}. We'll email you the moment it's there.</p>`
      : `<p style="margin:0 0 12px 0;">We'll email tracking as soon as it ships.</p>`;
  await sendEmail({
    from: SHOP_FROM,
    replyTo: SHOP_REPLY_TO,
    to: o.buyer_email,
    subject: `Order L${o.number} confirmed`,
    html: layout({
      heading: `Thanks, ${esc(first)}.`,
      body: `<p style="margin:0 0 12px 0;">Order <strong>L${o.number}</strong> is in.</p>${how}${itemsTable(items)}${totals(o)}`,
      cta: { href: orderUrl(o), label: 'View order' },
    }),
  });
}

export async function sendShippedEmail(o: Order) {
  if (!o.buyer_email) return;
  await sendEmail({
    from: SHOP_FROM,
    replyTo: SHOP_REPLY_TO,
    to: o.buyer_email,
    subject: `Order L${o.number} shipped`,
    html: layout({
      heading: 'Your hat is on the way.',
      body: `<p style="margin:0 0 12px 0;">Order <strong>L${o.number}</strong> shipped${o.carrier ? ` with ${esc(o.carrier)}` : ''}.${
        o.tracking_number ? ` Tracking number: <strong>${esc(o.tracking_number)}</strong>.` : ''
      }</p>`,
      cta: o.tracking_url ? { href: o.tracking_url, label: 'Track it' } : { href: orderUrl(o), label: 'View order' },
    }),
  });
}

export async function sendReadyForPickupEmail(o: Order, seller: Seller) {
  if (!o.buyer_email) return;
  await sendEmail({
    from: SHOP_FROM,
    replyTo: SHOP_REPLY_TO,
    to: o.buyer_email,
    subject: `Order L${o.number} is ready for pickup`,
    html: layout({
      heading: 'Ready for pickup.',
      body: `<p style="margin:0 0 12px 0;">Your order <strong>L${o.number}</strong> is waiting at <strong>${esc(seller.name)}</strong>${
        seller.pickup_address ? `, ${esc(seller.pickup_address)}` : ''
      }.</p>${seller.pickup_notes ? `<p style="margin:0 0 12px 0;color:#5C6168;">${esc(seller.pickup_notes)}</p>` : ''}<p style="margin:0;">Just give them your name and order number.</p>`,
      cta: { href: orderUrl(o), label: 'View order' },
    }),
  });
}

// ── Us ─────────────────────────────────────────────────────────────────────

export async function sendAdminNewOrder(o: Order, items: OrderItem[], sellers: Map<string, Seller>, shortProducts: string[]) {
  const who = [...new Set(items.map((i) => sellers.get(i.seller_id)?.name).filter(Boolean))].join(', ');
  const what = items.map((i) => `${i.title}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join(', ');
  const verb = o.delivery === 'pickup' ? 'Print & drop off' : 'Print & ship';
  const short = shortProducts.length
    ? `<p style="margin:0 0 12px 0;padding:10px 12px;background:#FFF4E5;border-radius:2px;"><strong>Out of buffer:</strong> ${shortProducts.map(esc).join(', ')}. Order from RoyalBacks.</p>`
    : '';
  await sendEmail({
    from: SHOP_FROM,
    to: notifyEmail(),
    subject: `${verb}: ${who} · ${what} (L${o.number})`,
    html: layout({
      heading: `${verb}: L${o.number}`,
      body: `${short}<p style="margin:0 0 6px 0;"><strong>${esc(o.buyer_name)}</strong> · ${esc(o.buyer_email)}</p>
        <p style="margin:0 0 12px 0;color:#5C6168;">${o.delivery === 'pickup' ? `Pickup at ${esc(sellers.get(o.pickup_seller_id ?? '')?.name)}` : 'Ship to buyer'}</p>
        ${itemsTable(items)}${totals(o)}`,
      cta: { href: `${siteUrl()}/admin/orders/m-${o.id}`, label: 'Open in admin' },
    }),
  });
}

export async function sendAdminApplication(s: Seller) {
  await sendEmail({
    from: SHOP_FROM,
    to: notifyEmail(),
    subject: `Market application: ${s.name}${s.town ? ` (${s.town})` : ''}`,
    html: layout({
      heading: `${esc(s.name)} wants to join the market.`,
      body: `<p style="margin:0 0 12px 0;">${esc(s.contact_name)} · ${esc(s.contact_email)}${s.contact_phone ? ` · ${esc(s.contact_phone)}` : ''}</p>
        <p style="margin:0 0 12px 0;color:#5C6168;">${esc(String(s.application?.about ?? s.blurb ?? ''))}</p>`,
      cta: { href: `${siteUrl()}/admin/market/sellers/${s.id}`, label: 'Review' },
    }),
  });
}

// ── Businesses ─────────────────────────────────────────────────────────────

export async function sendSellerInvite(s: Seller) {
  if (!s.contact_email || !s.invite_token) throw new Error('This business needs a contact email first.');
  const link = `${siteUrl()}${MARKET_BASE}/join/${s.invite_token}`;
  const first = s.contact_name?.split(' ')[0] || 'Hey';
  await sendEmail({
    from: SHOP_FROM,
    replyTo: SHOP_REPLY_TO,
    to: s.contact_email,
    subject: `Your hats on Townies: set up ${s.name}'s shop`,
    html: layout({
      heading: `${esc(first)}, your shop is ready to set up.`,
      body: `<p style="margin:0 0 12px 0;">We'd love to put <strong>${esc(s.name)}</strong>'s hats in the Townies local market, alongside other businesses from around Massachusetts.</p>
        <p style="margin:0 0 12px 0;">It takes about five minutes: check your info, pick which hats to sell, set your price, and connect where you want to get paid. We hold the stock, ship every order, and handle refunds. You get your share of every hat sold.</p>`,
      cta: { href: link, label: 'Set up my shop' },
    }),
  });
}

export async function sendSellerSale(s: Seller, o: Order, items: OrderItem[]) {
  if (!s.contact_email) return;
  const mine = items.filter((i) => i.seller_id === s.id);
  const earned = mine.reduce((n, i) => n + i.seller_payout_cents, 0);
  const count = mine.reduce((n, i) => n + i.qty, 0);
  await sendEmail({
    from: SHOP_FROM,
    replyTo: SHOP_REPLY_TO,
    to: s.contact_email,
    subject: `You sold ${count} hat${count === 1 ? '' : 's'} on Townies`,
    html: layout({
      heading: `Nice. ${count} hat${count === 1 ? '' : 's'} sold.`,
      body: `${itemsTable(mine)}<p style="margin:12px 0 0 0;">You earn <strong>${dollars(earned)}</strong>. It's paid out 14 days after the order ${
        o.delivery === 'pickup' ? 'is picked up' : 'ships'
      }.</p>${o.delivery === 'pickup' ? `<p style="margin:12px 0 0 0;">This one is a pickup at your place. We'll drop it off and let you know.</p>` : ''}`,
    }),
  });
}

// ── RoyalBacks ─────────────────────────────────────────────────────────────

export async function sendReorderRequest(p: Product, s: Seller, qty: number, note?: string | null) {
  const to = royalbacksEmail();
  if (!to) throw new Error('SHOP_ROYALBACKS_EMAIL is not set, so the reorder could not be emailed.');
  await sendEmail({
    from: SHOP_FROM,
    replyTo: SHOP_REPLY_TO,
    to,
    cc: notifyEmail(),
    subject: `Reorder: ${qty} × ${s.name} · ${p.title}`,
    html: layout({
      heading: `Reorder: ${qty} hats`,
      body: `<p style="margin:0 0 12px 0;"><strong>${esc(s.name)}</strong> · ${esc(p.title)} (${p.wholesale_type})</p>
        ${p.image_url ? `<p style="margin:0 0 12px 0;"><img src="${absoluteUrl(p.image_url)}" alt="" width="220" style="max-width:220px;border-radius:2px;"></p>` : ''}
        <p style="margin:0 0 12px 0;">Quantity: <strong>${qty}</strong></p>
        ${note ? `<p style="margin:0 0 12px 0;color:#5C6168;">${esc(note)}</p>` : ''}`,
    }),
  });
}
