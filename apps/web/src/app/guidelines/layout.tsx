import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Guidelines | Azeebo+',
  description:
    'Standards and principles for maintaining a safe, creative, and respectful community on Azeebo+.',
};

export default function GuidelinesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
