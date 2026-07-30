import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Premium Subscription',
  description: 'Azeebo+ - Unlock exclusive content and features with a premium subscription',
};

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
