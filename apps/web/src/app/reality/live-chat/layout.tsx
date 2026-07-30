import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Chat',
  description: 'Azeebo+ - Join the live conversation with other fans during reality shows',
};

export default function LiveChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
