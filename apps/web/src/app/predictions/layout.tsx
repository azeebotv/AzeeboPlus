import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Predictions',
  description: 'Azeebo+ - Track your prediction history, accuracy, and earn points',
};

export default function PredictionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
