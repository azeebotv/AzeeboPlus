import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Celebrity Profile | Azeebo',
  description: 'View celebrity profile, bio, and exclusive content on Azeebo.',
  openGraph: {
    title: 'Celebrity Profile | Azeebo',
    description: 'View celebrity profile, bio, and exclusive content on Azeebo.',
  },
};

export default function CelebrityDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
