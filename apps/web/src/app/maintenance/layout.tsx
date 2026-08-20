import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Under Scheduled Maintenance | Azeebo+',
  description: 'Azeebo+ is currently undergoing scheduled maintenance to upgrade your streaming experience.',
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
