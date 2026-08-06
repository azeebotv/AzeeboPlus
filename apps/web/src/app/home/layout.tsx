import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Your personalized Azeebo+ homepage. Discover trending content, watch latest shows, and explore your favorite universes.',
  openGraph: {
    title: 'Home | Azeebo+',
    description:
      'Your personalized Azeebo+ homepage. Discover trending content, watch latest shows, and explore your favorite universes.',
  },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
