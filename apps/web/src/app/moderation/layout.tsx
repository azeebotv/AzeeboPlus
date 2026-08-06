import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content Moderation',
  description: 'Azeebo+ - Report and review content to help keep the community safe',
};

export default function ModerationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
