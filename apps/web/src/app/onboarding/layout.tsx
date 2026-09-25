import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome to Azeebo+',
  description: 'Azeebo+ - Get started and personalize your experience with African entertainment',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
