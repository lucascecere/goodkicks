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

    // Signing secret for the Shopify order webhook. Without it, that route
    // rejects every request rather than trusting unsigned input.
    SHOPIFY_WEBHOOK_SECRET?: string;

    // Content Studio — all optional. Templates render on mock data with none
    // of these set; the feeds only fill values in automatically.
    THE_ODDS_API_KEY?: string;
    STUDIO_SPORTS_PROVIDER?: string;
  }
}
