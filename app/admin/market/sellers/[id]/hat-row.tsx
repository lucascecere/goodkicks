'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ActionForm } from '@/components/admin/action';
import { Badge, btn, field } from '@/components/admin/ui';
import { dollars, WHOLESALE_LABEL } from '@/lib/shop/money';
import type { Product } from '@/lib/shop/types';
import { updateProductAction } from '../../actions';
import { ReorderButton } from '../../reorder-button';

const label = 'admin-eyebrow mb-1.5 block';

export function HatRow({ hat }: { hat: Product }) {
  const [open, setOpen] = useState(false);
  const low = hat.on_hand < hat.stock_buffer;
  return (
    <li className="px-4 py-3 sm:px-5">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 text-left">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-town-cream">
          {hat.image_url && <Image src={hat.image_url} alt="" fill sizes="56px" className="object-contain p-1 mix-blend-multiply" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-town-cream">{hat.title}</p>
          <p className="text-xs text-town-cream/50">
            {WHOLESALE_LABEL[hat.wholesale_type]} ·{' '}
            <span className={low ? 'text-amber-300' : ''}>
              {hat.on_hand} on hand / buffer {hat.stock_buffer}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm tabular-nums text-town-cream">{hat.price_cents ? dollars(hat.price_cents) : 'No price'}</span>
          {hat.status === 'active' ? <Badge tone="good">Selling</Badge> : hat.status === 'archived' ? <Badge>Archived</Badge> : <Badge tone="warn">Not selling</Badge>}
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-town-cream/10 pt-4">
          <ActionForm action={updateProductAction.bind(null, hat.id)} className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className={label}>Name</label>
              <input name="title" defaultValue={hat.title} className={field} />
            </div>
            <div>
              <label className={label}>Type</label>
              <select name="wholesale_type" defaultValue={hat.wholesale_type} className={field}>
                <option value="everyday">Everyday ($22)</option>
                <option value="lifestyle">Lifestyle ($24)</option>
              </select>
            </div>
            <div>
              <label className={label}>Price (theirs to set)</label>
              <input name="price" inputMode="decimal" defaultValue={hat.price_cents ? (hat.price_cents / 100).toFixed(2) : ''} className={field} />
            </div>
            <div>
              <label className={label}>On hand</label>
              <input name="on_hand" type="number" defaultValue={hat.on_hand} className={field} />
            </div>
            <div>
              <label className={label}>Buffer</label>
              <input name="stock_buffer" type="number" min={0} defaultValue={hat.stock_buffer} className={field} />
            </div>
            <div>
              <label className={label}>Status</label>
              <select name="status" defaultValue={hat.status} className={field}>
                <option value="active">Selling</option>
                <option value="draft">Not selling</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Replace photo</label>
              <input name="image" type="file" accept="image/*" className={`${field} file:mr-3 file:border-0 file:bg-town-cream file:px-2 file:py-1 file:text-xs file:text-town-navy`} />
            </div>
            <div className="sm:col-span-3">
              <label className={label}>Description</label>
              <input name="description" defaultValue={hat.description ?? ''} className={field} />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" className={btn.primary}>Save hat</button>
            </div>
          </ActionForm>
          <ReorderButton productId={hat.id} suggested={Math.max(1, hat.stock_buffer - hat.on_hand)} />
        </div>
      )}
    </li>
  );
}
