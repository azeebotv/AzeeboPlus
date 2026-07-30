import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Azeebo+ - Manage your preferences, account, and download quality',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
