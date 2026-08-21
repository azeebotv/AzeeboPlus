import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Azeebo+',
  description:
    'Terms and conditions governing the use of the Azeebo+ streaming platform and services.',
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
