import { Navigate } from 'react-router-dom';
import { useCreatorFlags } from '@/hooks/useCreatorFlags';

interface FlagGateProps {
  flag: string;
  children: React.ReactNode;
}

/** Redirects to the dashboard when the given creator studio flag is disabled. */
export function FlagGate({ flag, children }: FlagGateProps) {
  const { isEnabled, isLoading } = useCreatorFlags();
  if (isLoading) return null;
  if (!isEnabled(flag)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
