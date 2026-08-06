import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Library',
  description: 'Azeebo+ - Access your watchlist, watch history, and favorite content',
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
