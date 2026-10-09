import { BagButton } from '@/components/market/bag-button';
import { marketOpen } from '@/lib/shop/config';

export default function LocalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bg">
      {children}
      {marketOpen() && <BagButton />}
    </div>
  );
}
