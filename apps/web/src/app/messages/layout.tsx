import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Azeebo+ - Send and receive messages from creators and other users',
};

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
