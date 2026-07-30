import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help & Support',
  description: 'Azeebo+ - Get help with your account, subscriptions, and common questions',
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
