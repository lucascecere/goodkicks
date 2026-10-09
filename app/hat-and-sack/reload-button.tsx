'use client';

/** Soft retry for a failed Shopify read on /hat-and-sack. */
export function ReloadButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="inline-flex bg-text px-7 py-3.5 font-label text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-white"
    >
      Reload
    </button>
  );
}
