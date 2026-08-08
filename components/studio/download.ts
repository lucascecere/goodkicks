'use client';

// Content Studio — one definition of "download a file".
//
// The editor and the queue cards both do this, and doing it twice invites the
// classic leak: forgetting revokeObjectURL keeps the whole blob (a 1–2MB PNG
// each) alive for the life of the page.

export function downloadBlob(blob: Blob, filename: string): void {
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  // Must be in the document for the click to register in Firefox.
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

/**
 * Fetch a URL and save it. Throws with the server's own message so callers can
 * surface something better than "failed".
 */
export async function downloadUrl(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.text()) || `Request failed (${res.status})`);
  downloadBlob(await res.blob(), filename);
}
