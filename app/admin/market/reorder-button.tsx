'use client';

import { useState } from 'react';
import { ActionForm } from '@/components/admin/action';
import { btn, field } from '@/components/admin/ui';
import { reorderAction } from './actions';

/** "Reorder from RoyalBacks": opens to a quantity and an optional note. */
export function ReorderButton({ productId, suggested }: { productId: string; suggested: number }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className={btn.secondary} onClick={() => setOpen(true)}>
        Reorder from RoyalBacks
      </button>
    );
  }
  return (
    <ActionForm action={reorderAction.bind(null, productId)} className="flex flex-wrap items-center gap-2">
      <input name="qty" type="number" min={1} max={500} defaultValue={suggested} aria-label="Quantity" className={`${field} w-20`} />
      <input name="note" placeholder="Note (optional)" className={`${field} w-48`} />
      <button type="submit" className={btn.primary}>
        Send
      </button>
      <button type="button" className={btn.ghost} onClick={() => setOpen(false)}>
        Cancel
      </button>
    </ActionForm>
  );
}
