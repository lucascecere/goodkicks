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
| Tax | None: not registered, by decision (hats under $175 are exempt clothing in MA). `automatic_tax` is off; see `automaticTaxOn()` |
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

## Before launch: cleanup
- [ ] Delete the **Test Shop** (slug `test-shop`) and its test orders. As of 10-09 that covers L1002–L1004 (abandoned test checkouts) and test order **L1005** (bought, shipped without a label, $8.00 paid out, refunded and reversed in Stripe test mode). It is kept as status `approved` and only shows where `SHOP_SHOW_TEST_SHOPS=true` (preview), but remove it before ordering opens:
  ```sql
  begin;
  delete from shop_payouts where order_id in (select distinct order_id from shop_order_items where seller_id = (select id from shop_sellers where slug = 'test-shop'));
  delete from shop_orders where id in (select distinct order_id from shop_order_items where seller_id = (select id from shop_sellers where slug = 'test-shop'));
  -- L1001: an abandoned (never paid) test checkout on Rocco's from preview testing.
  delete from shop_orders where number = 1001 and status = 'pending';
  delete from shop_sellers where slug = 'test-shop';  -- cascades its products
  commit;
  ```
- [ ] Big Red Moving was reset on 10-09 (no Stripe account, no email, not joined). It onboards for real through its own join link.
- [ ] Remove `SHOP_SHOW_TEST_SHOPS` from the preview env.
- [ ] Stripe test mode: optionally close the Test Shop's test connected account (Connect → Accounts, test mode). It never exists in live mode.

## Stripe (Townies, `acct_1UOiHOF0AfMGvrCm`): done 10-09
- The legal entity is Tetra Media LLC, operating as **Townies** (Townies has no LLC of its own; this is intentional).
- Live: account active, public name, branding, Connect onboarding name "Townies", platform profile + both acknowledgements.
- Live webhook `we_1UOoxhF0AfMGvrCmHSErTo2g` → `https://townies.shop/api/shop/webhook`, "Your account" scope, API version 2026-09-30.endive. Events: checkout.session.completed / async_payment_succeeded / async_payment_failed / expired, charge.refunded, charge.dispute.created. The handlers don't depend on payload shape: sessions and charges are re-read with the pinned client.
- **No "Connected accounts" webhook is needed.** Seller payout status is read straight from Stripe when a seller comes back from onboarding (`?connected=1`), from the admin "Check status" button, and again right before every transfer. `account.updated` handling stays in code, harmlessly unused.
- **Sales tax: not registered, by decision.** Hats under $175 are exempt clothing in MA, and Shopify tax is off too. Checkout runs with `automatic_tax` OFF (`SHOP_AUTOMATIC_TAX` unset), and bag, emails and the order page show $0 / no tax line. Stripe Tax keeps the head-office address. Only set `SHOP_AUTOMATIC_TAX=true` after adding a registration.

## Launch day
**1. Vercel → goodkicks → Settings → Environment Variables → Production** (you paste these):

| Variable | Value |
|---|---|
| `SHOP_STRIPE_SECRET_KEY` | Townies **live** secret key (Stripe → Developers → API keys, live mode, Townies account) |
| `SHOP_STRIPE_WEBHOOK_SECRET` | signing secret of `we_1UOoxhF0AfMGvrCmHSErTo2g` (Developers → Webhooks → that endpoint → Reveal) |
| `SHIPPO_API_KEY` | Shippo → Settings → API → **live** token (`shippo_live_…`) |
| `SHOP_SHIP_FROM` | `{"name":"Townies","street1":"29 Brookmill Road","city":"Stow","state":"MA","zip":"01775","country":"US","email":"info@townies.shop"}` |
| `SHOP_ROYALBACKS_EMAIL` | Dylan's email (reorder requests) |
| `SHIPPO_WEBHOOK_TOKEN` | any long random string; then add a Shippo `track_updated` webhook to `https://townies.shop/api/shop/shippo?token=<it>` |
| `SHOP_MARKET_OPEN` | `true`. Set this **last**: it turns ordering on |

Check: `NEXT_PUBLIC_SITE_URL` = `https://townies.shop`; `SHOP_SHOW_TEST_SHOPS` and `SHOP_AUTOMATIC_TAX` **unset**. Adding `SHOP_STRIPE_SECRET_KEY` alone already lets businesses connect payouts (join pages stop saying "Payouts open soon"), so sellers can onboard before ordering opens. Env changes need a redeploy.

**2. Before opening:** run the cleanup SQL above (with Lucas's OK), and make sure each live shop has its real email, prices and connected payouts.

**3. First real order (low value, your own card):**
1. Temporarily price one hat at a small amount, or buy a real one; ship to yourself.
2. Check out on townies.shop/local with your own card. Confirm: thank-you page, receipt email, "Print & ship" email to info@townies.shop, and the order in Admin › Orders (Market tab) as Paid / To ship.
3. Buy the real USPS label from the order page (real postage, a few dollars), then Mark shipped. Confirm the tracking email.
4. Market › Payouts: the business's share shows "On hold" with a release date. Optionally "Send now" to prove a real transfer reaches the business's bank.
5. Refund the order from the admin (red button). Confirm the refund in Stripe, the payout canceled or reversed, and stock back. Void the Shippo label in Shippo if it wasn't used, to get the postage back.

## Safety rails (in code)
- Real labels: `labelGuard()` in `lib/shop/shippo.ts` refuses a live Shippo key outside production or on test-mode payments, and refuses a test Shippo key on live production orders.
- Test shops: `test-*` slugs stay `approved` and only open where `SHOP_SHOW_TEST_SHOPS=true` (preview).
- Preview redirects: `siteUrl()` uses `VERCEL_BRANCH_URL` on previews, so Stripe returns never land on townies.shop.
