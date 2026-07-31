import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Creator Analytics',
  description:
    'Azeebo+ - Track your content performance, engagement metrics, and audience demographics',
};

export default function CreatorAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
