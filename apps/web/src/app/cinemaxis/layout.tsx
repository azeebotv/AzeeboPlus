import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cinemaxis - Premium African Cinema',
  description:
    'Azeebo+ - Premium African cinema featuring blockbuster movies, award-winning films, and exclusive releases',
};

export default function CinemaxisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
