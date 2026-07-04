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
  }
}
