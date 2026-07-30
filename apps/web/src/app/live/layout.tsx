import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Events',
  description: 'Azeebo+ - Watch pay-per-view concerts, comedy shows, sports events, and more',
};

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
