# Townies local market + our own checkout

The local market lives at `townies.shop/local`. Each local business gets a stall that shows its hats. Buyers check out through **our own Stripe account**, not Shopify, and we pay each business its share through Stripe Connect.

## Where things are
- **Public pages:** `app/local/*`
  - market: `/local`
  - stall: `/local/[slug]`
  - bag: `/local/bag`
  - order status: `/local/order/[id]`
  - business join link: `/local/join/[token]`
  - application form: `/local/apply`
- **Admin:**
  - `Admin › Market` (stalls, payouts, reorders)
  - Market orders show up in `Admin › Orders` next to Shopify orders.
- **Engine:** `lib/shop/*`
  - money rules: `money.ts`, tested in `money.test.mts` (`npm test`)
  - checkout, webhook, payouts, Shippo labels, emails
- **Tables:** `shop_*`, defined in `docs/migrations/2026-10-09_shop_commerce.sql` (applied 2026-10-09).
- **Images:** Supabase Storage bucket `shop`.

## Money
| | |
|---|---|
| We keep per hat | Everyday $22, lifestyle $24 |
| Business gets | price − wholesale |
| RoyalBacks (Dylan) | $5 of our cut per hat, only for businesses flagged RoyalBacks-sourced |
| Shipping (buyer pays) | 1 hat $5.95 · 2 hats $8.95 · 3+ $12.95 · pickup free |
| Tax | Stripe Tax, clothing code; MA exempts clothing under $175 |
| Payouts | Held until the hat ships or is picked up, then 14 days. Sent by the daily cron `/api/cron/shop-payouts` |
| Refund before payout | The business's payout is canceled |
| Refund after payout | The business's transfer is reversed |

## Turning it on
1. **Stripe:** create a new account ("Townies Local").
   - Connect: platform, Express accounts, platform pays fees.
   - Stripe Tax: turn it on and register in MA.
2. **Vercel env** (Preview first, with test keys):
   - `SHOP_STRIPE_SECRET_KEY`: sk_test_… then sk_live_…
   - `SHOP_STRIPE_WEBHOOK_SECRET`: from a webhook endpoint at `https://townies.shop/api/shop/webhook`.
     - Account events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`.
     - Connected-account events: `account.updated`.
   - `SHIPPO_API_KEY`
   - `SHOP_SHIP_FROM`: JSON, e.g. `{"name":"Townies","street1":"…","city":"Milton","state":"MA","zip":"02186","phone":"…"}`
   - `SHOP_ROYALBACKS_EMAIL`: where reorder requests go.
   - `SHIPPO_WEBHOOK_TOKEN`: any long random string. In Shippo, add a `track_updated` webhook to `https://townies.shop/api/shop/shippo?token=<it>`. This is how orders get marked delivered and the review email gets queued.
   - `SHOP_NOTIFY_EMAIL` (optional): defaults to info@townies.shop.
3. **Dylan:** go to Admin › Market › Payouts › Copy Dylan's link and text it to him. Once he finishes, his $5 a hat goes out with every payout. The account id is saved in `shop_settings`; `SHOP_ROYALBACKS_ACCOUNT_ID` is only an override.

## Day to day
1. **Add a business.** In Admin › Market › Add business, then add their hat designs (photo, everyday or lifestyle, on hand).
2. **Send the invite.** The business picks hats, sets prices and connects payouts on their link.
3. **Open the stall.**
4. **Ship orders.** An order emails "Print & ship" to info@townies.shop.
   - Shipping: open the order, Buy USPS label, print it, then Mark shipped.
   - Pickup: Dropped at the shop, then Buyer picked it up.
5. **Reviews.** Market buyers join Customers. They get the same single "How's the hat?" email, 7 days after delivery or pickup.
6. **Reorder.** When a hat drops below its buffer of 5, use Reorder from RoyalBacks. When the box lands, use Received, add to stock.
