import { Navigate } from 'react-router-dom';
import { useAdminFlags } from '@/hooks/useAdminFlags';

interface FlagGateProps {
  flag: string;
  children: React.ReactNode;
}

/** Redirects to the dashboard when the given admin flag is disabled. */
export function FlagGate({ flag, children }: FlagGateProps) {
  const { isEnabled, isLoading } = useAdminFlags();
  if (isLoading) return null;
  if (!isEnabled(flag)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
