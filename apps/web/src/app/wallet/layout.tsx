import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wallet',
  description: 'Azeebo+ - Manage your balance, deposit funds, and view transaction history',
};

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
