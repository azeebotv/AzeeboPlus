import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comedy Universe',
  description: 'Azeebo+ - Watch the best African comedy clips, stand-up specials, and hilarious skits',
};

export default function ComedyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
