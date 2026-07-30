import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'Azeebo+ - Stay updated with likes, comments, follows, and system alerts',
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
