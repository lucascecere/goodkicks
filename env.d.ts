declare namespace NodeJS {
  interface ProcessEnv {
    SHOPIFY_STORE_DOMAIN: string;
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: string;
    SHOPIFY_TOWNIES_COLLECTION?: string;
    SHOPIFY_GOODKICKS_COLLECTION?: string;
    NEXT_PUBLIC_SITE_URL: string;
    CONTACT_EMAIL: string;
    RESEND_API_KEY?: string;
    RESEND_WEBHOOK_SECRET?: string;

    // Signs admin session cookies. Falls back to ADMIN_PASSWORD when unset, so
    // sessions work before it exists — but setting it means changing the admin
    // password no longer invalidates every session.
    ADMIN_SESSION_SECRET?: string;

    // Signs the rotary spin result so the browser can't pick its own prize.
    // Falls back to ADMIN_SESSION_SECRET, then ADMIN_PASSWORD; if none of the
    // three is set, /api/spin returns 503 rather than issuing forgeable tokens.
    SPIN_SECRET?: string;

    // Townies sender address. Leave UNSET until Resend reports townies.shop
    // verified — Resend rejects unverified senders, so setting it early makes
    // every spin code email fail.
    TOWNIES_FROM_EMAIL?: string;

    // Signing secret for the Shopify order webhook. Without it, that route
    // rejects every request rather than trusting unsigned input.
    SHOPIFY_WEBHOOK_SECRET?: string;

    // Serves goodkicks.co from the /goodkicks subtree. Read in middleware.ts as
    // an exact 'true' compare, so anything else (including unset) leaves the
    // rewrite off. Stays off until the townies.shop cutover — see M3.
    ENABLE_GK_HOST_REWRITE?: string;

    // Content Studio — all optional. Templates render on mock data with none
    // of these set; the feeds only fill values in automatically.
    THE_ODDS_API_KEY?: string;
    STUDIO_SPORTS_PROVIDER?: string;
  }
}
