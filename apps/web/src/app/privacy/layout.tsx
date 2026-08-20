import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Azeebo+',
  description: 'How Azeebo+ collects, protects, and respects your personal information and privacy.',
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
