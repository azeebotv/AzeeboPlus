import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Content',
  description: 'Azeebo+ - Discover and explore movies, shows, comedy, sports, and more',
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
