import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rewards',
  description: 'Azeebo+ - Earn points, complete missions, and unlock amazing rewards',
};

export default function RewardsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
