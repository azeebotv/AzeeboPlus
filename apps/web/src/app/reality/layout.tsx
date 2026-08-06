import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reality Universe',
  description: 'Azeebo+ - Watch reality shows, vote for contestants, and earn rewards',
};

export default function RealityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
