import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Movies',
  description: 'Azeebo+ - Stream premium African movies, blockbusters, and exclusive releases',
};

export default function MoviesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
