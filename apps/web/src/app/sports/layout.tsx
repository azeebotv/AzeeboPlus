import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sports Universe',
  description: 'Azeebo+ - Watch live sports, matches, and make predictions',
};

export default function SportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
