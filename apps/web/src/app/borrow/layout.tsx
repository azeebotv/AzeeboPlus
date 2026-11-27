import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Borrow',
  description:
    'Compare loan offers from Azeebo+’s approved partner banks, with rate ranges, fees and total-cost disclosures published on every offer.',
};

export default function BorrowLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
