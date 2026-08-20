import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Celebrities | Azeebo+',
  description: 'Discover A-list talent, exclusive coverage, and celebrity profiles on Azeebo+.',
  openGraph: {
    title: 'Celebrities | Azeebo+',
    description: 'Discover A-list talent, exclusive coverage, and celebrity profiles on Azeebo+.',
  },
};

export default function CelebritiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
