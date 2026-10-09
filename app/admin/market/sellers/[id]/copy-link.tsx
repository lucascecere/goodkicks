'use client';

import { useState } from 'react';
import { btn } from '@/components/admin/ui';

export function CopyLink({ url, label = 'Copy join link' }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={btn.secondary}
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
