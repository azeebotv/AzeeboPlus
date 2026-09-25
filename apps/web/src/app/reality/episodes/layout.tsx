import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Episodes',
  description: 'Azeebo+ - Browse and watch reality show episodes by season',
};

export default function EpisodesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
