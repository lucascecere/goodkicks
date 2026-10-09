import { EmptyState, PageHeader } from '@/components/admin/ui';

// Placeholder until the marketplace build lands (stalls, payouts, reorders).
export default function MarketAdminPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Market"
        title="Local market"
        description="Local businesses selling their hats on Townies: stalls, their hats, payouts and reorders from RoyalBacks."
      />
      <EmptyState title="Being built" body="Stalls, payouts and the RoyalBacks reorder button show up here next." />
    </div>
  );
}
