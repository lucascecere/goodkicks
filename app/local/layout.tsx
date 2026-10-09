import { BagButton } from '@/components/market/bag-button';

export default function LocalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bg">
      {children}
      <BagButton />
    </div>
  );
}
