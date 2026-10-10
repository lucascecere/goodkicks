import { Card, PageHeader, btn, field } from '@/components/admin/ui';
import { createSellerAction } from '../../actions';

const label = 'admin-eyebrow mb-1.5 block';

export default function NewSellerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        back={{ href: '/admin/market', label: 'Market' }}
        eyebrow="Market"
        title="Add a business"
        description="A hat client we already work with. Next, add their hats. Then either send them their link, or set everything up yourself and have them connect payouts."
      />
      <Card>
        <form action={createSellerAction} className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="name">Business name *</label>
            <input id="name" name="name" required className={field} />
          </div>
          <div>
            <label className={label} htmlFor="town">Town</label>
            <input id="town" name="town" className={field} placeholder="Milton" />
          </div>
          <div>
            <label className={label} htmlFor="logo">Logo</label>
            <input id="logo" name="logo" type="file" accept="image/*" className={`${field} file:mr-3 file:border-0 file:bg-town-cream file:px-2 file:py-1 file:text-xs file:text-town-navy`} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="cover">Shop photo (storefront, crew in the hats). Big on the market page.</label>
            <input id="cover" name="cover" type="file" accept="image/*" className={`${field} file:mr-3 file:border-0 file:bg-town-cream file:px-2 file:py-1 file:text-xs file:text-town-navy`} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="blurb">One or two lines about them</label>
            <textarea id="blurb" name="blurb" rows={2} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="contact_name">Contact name</label>
            <input id="contact_name" name="contact_name" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="contact_email">Contact email</label>
            <input id="contact_email" name="contact_email" type="email" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="contact_phone">Phone</label>
            <input id="contact_phone" name="contact_phone" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="website">Website</label>
            <input id="website" name="website" className={field} placeholder="https://" />
          </div>
          <div>
            <label className={label} htmlFor="instagram">Instagram</label>
            <input id="instagram" name="instagram" className={field} placeholder="@theirshop" />
          </div>
          <label className="flex items-center gap-2 text-sm text-town-cream/80 sm:col-span-2">
            <input type="checkbox" name="pickup_enabled" /> Free pickup at their place
          </label>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="pickup_address">Pickup address</label>
            <input id="pickup_address" name="pickup_address" className={field} />
          </div>
          <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-town-cream/80">
            <input type="checkbox" name="is_royalbacks_sourced" /> Came to us through RoyalBacks ($5 a hat to Dylan)
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={btn.primary}>Create business</button>
          </div>
        </form>
      </Card>
    </div>
  );
}
