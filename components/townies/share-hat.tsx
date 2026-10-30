'use client';

import { useState } from 'react';

/**
 * Hats get bought for a town, and towns live in group chats. Phones get the
 * native share sheet; desktop copies the link.
 */
export function ShareHat({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const link = `${url}?utm_source=share&utm_medium=pdp`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={share}
      className="mt-4 text-xs text-muted underline underline-offset-2 hover:text-text transition-colors"
    >
      {copied ? 'Link copied' : 'Send this to the group chat'}
    </button>
  );
}
