import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Music Universe',
  description: 'Azeebo+ - Stream music videos, live performances, and exclusive drops',
};

export default function MusicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
