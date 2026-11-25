// Where the local market lives on townies.shop. Client-safe.
export const MARKET_BASE = '/local';

/**
 * Is the market shown to the public? Lucas 11-25: "remove the local market from
 * the website for now". While false: no footer link, no sitemap entries, and the
 * public market pages (/local, stalls, bag, apply) redirect to /shop. Seller
 * invite links (/local/join) and Admin › Market keep working. Flip to true to
 * bring it back.
 */
export const MARKET_VISIBLE = false;
