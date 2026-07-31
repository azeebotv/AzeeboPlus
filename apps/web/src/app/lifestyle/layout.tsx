import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lifestyle',
  description:
    'Azeebo+ - Explore celebrities, influencers, nightlife, and lifestyle events across Africa',
};

export default function LifestyleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
