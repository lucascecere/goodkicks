declare namespace NodeJS {
  interface ProcessEnv {
    SHOPIFY_STORE_DOMAIN: string;
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: string;
    NEXT_PUBLIC_SITE_URL: string;
    CONTACT_EMAIL: string;
    RESEND_API_KEY?: string;
  }
}
