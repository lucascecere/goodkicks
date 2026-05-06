# Welcome Email Template — v3

**Use:** Sent to ambassadors when they're approved for Starter tier.

**Format:** Plain text. Casual peer-to-peer voice. Matches the brand.

**Merge variables:**
- `{{first_name}}` — ambassador's first name (or IG handle)
- `{{discount_code}}` — their personal Starter code (e.g. `MILTONHIGH15`)
- `{{colorway}}` — the colorway they picked on the application

---

## Subject line options

1. `welcome to good kicks ambassadors`
2. `your good kicks code is live`
3. `you're in. here's your code.`

My pick: **option 3.**

---

## Email body (plain text)

```
hey {{first_name}},

welcome in. you're now a good kicks starter ambassador.

your personal code:
{{discount_code}} · 15% off

your followers can use this at goodkicks.co. it's tied to you, so we see every time it's used.

your starter sac ({{colorway}}) is shipping out this week. dm us @goodkicks if you want to switch up the colorway before we send it.

—

three things we ask — these apply at every tier:

1. link to goodkicks.co in your bio (linktree is fine if you have multiple links — just make sure ours is one)
2. your code in your bio (somewhere visible — text or pinned story highlight)
3. @goodkicks mention on every post or reel where the sac shows up — caption tag or verbal shoutout, your call

that's the whole ask. we don't tell you when to post, what to post, or what to say. just give us credit whenever the sac is on camera.

—

what you get

- 1 free sac (already on the way)
- your personal code, 15% off for your followers
- 8% commission on every order placed with your code, paid monthly
- first access to v2 drops + future colorways
- reposts on our main account when you tag us

—

leveling up

starter (you are here): 15% code, 8% commission, 1 free sac
repping: 20% code, 9% commission, +2 sacs · earn it with 5+ tagged posts or 5+ code redemptions
anchor: 25% code, 10% commission, +6 sacs, custom colorway possible · earn it with 15+ posts or 25+ redemptions

we track this manually. when you hit a milestone, dm us — we'll bump your tier, update your code, and start tracking your commission.

—

how commissions work

every order placed with your code earns you a commission, paid monthly via venmo or paypal.

we'll ask for your payment info when you hit repping (where commissions get more meaningful). no need to share payment details at starter — focus on getting your sac, posting if you feel like it, and seeing how the program vibes with your account.

—

heads up: if any of the three baseline requirements above slip (link gone from bio, code missing, mentions skipped on posts with the sac), we'll dm you a friendly reminder. if they're still missing after that, your code gets deactivated. no hard feelings, just keeps the program clean.

your code also auto-expires after 90 days of inactivity — easy to re-earn by posting again.

questions? just reply to this email or dm @goodkicks.

welcome to the circle.

— lucas
good kicks
```

---

## Notes for whoever sets up the automation

### Trigger

Fires when:
- An applicant is approved (via `/api/admin/approve-ambassador` endpoint)
- The Shopify discount code has been generated successfully

### Required setup before first send

1. **Verify domain in Resend** — `goodkicks.co` should be added to Resend → Domains with SPF/DKIM/DMARC DNS records configured. Without this, emails come from `onboarding@resend.dev` (looks scammy).
2. **Verify sender address** — `hello@goodkicks.co` should be the sender (or whatever you set in `EMAIL_FROM`). Must be a real address that can receive replies.
3. **Populate merge variables** before sending: `{{first_name}}`, `{{discount_code}}`, `{{colorway}}`.

### What NOT to include

- ❌ No HTML email styling. Plain text is intentional — fits the brand voice better.
- ❌ No long brand history / founder story.
- ❌ No "follow us on TikTok / Twitter" calls. Focus on Instagram.
- ❌ No multiple competing CTAs. One job: confirm them, hand off the code, set the expectations.
- ❌ No discount expiration warnings or pressure tactics.
