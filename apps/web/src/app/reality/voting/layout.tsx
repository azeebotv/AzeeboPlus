import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vote Now',
  description: 'Azeebo+ - Support your favorite reality show contestants with your votes',
};

export default function VotingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
