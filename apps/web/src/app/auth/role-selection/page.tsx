'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Users } from 'lucide-react';
import { webLogger } from '@/lib/logger';
import { apiFetch, type ApiResponse } from '@/lib/api';
import { refreshAuthCookie } from '@/lib/cookie-utils';
import { useAuth } from '@/context/AuthContext';
import AuthShell from '@/components/auth/AuthShell';
import { Alert, Spinner } from '@/components/auth/FormBits';

type Role = 'user' | 'creator';

// /auth/select-role answers flat — {success, message, access_token} with no
// `data` wrapper, unlike the login/register envelopes.
export type SelectRoleResult = ApiResponse<never> & { access_token?: string };

const ROLES: {
  id: Role;
  title: string;
  icon: typeof Users;
  description: string;
  sub: string;
}[] = [
  {
    id: 'user',
    title: 'Regular User',
    icon: Users,
    description: 'Enjoy premium Nigerian content',
    sub: 'Discover music, movies, creators and entertainment',
  },
  {
    id: 'creator',
    title: 'Creator',
    icon: Film,
    description: 'Build your audience and brand',
    sub: 'Publish and get paid — a Creator account keeps full viewer access',
  },
];

export default function RoleSelectionPage(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Role | null>(null);
  const router = useRouter();
  const { refreshUser } = useAuth();

  const handleRoleSelection = async (role: Role): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setActive(role);
    try {
      const result = (await apiFetch<SelectRoleResult>('/v1/auth/select-role', {
        method: 'POST',
        body: JSON.stringify({ role }),
      })) as SelectRoleResult;
      if (!result.success) {
        throw new Error(result.message || 'Failed to select role');
      }
      // The access token the browser is presenting still claims the previous
      // role, and the panels gate on /auth/me, which echoes that claim. Adopt
      // the re-minted one before moving on, otherwise a user who just chose
      // 'creator' is told they are not a creator until the old token expires.
      if (result.access_token) {
        await refreshAuthCookie(result.access_token);
        await refreshUser();
      }
      router.push('/auth/profile-setup');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to select role';
      setError(message);
      webLogger.error('Role selection failed', { error: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      headlineLines={['One account,', 'two ways in']}
      tagline="Your curated home for Nigerian content, community and creation."
    >
      <div>
        <h2 className="az-title text-az-ink">Select your Azeebo+ role</h2>
        <p className="az-body mt-2 text-az-ink/60">
          You can change this later — it only decides what you see first.
        </p>
      </div>

      {error && (
        <div className="mt-5">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {ROLES.map((role) => {
          const isActive = active === role.id;
          const pending = isActive && isLoading;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => handleRoleSelection(role.id)}
              disabled={isLoading}
              className={`flex w-full cursor-pointer items-center gap-4 rounded-az-panel border p-4 text-left transition-colors disabled:cursor-wait ${
                isActive
                  ? 'border-az-flame bg-az-flame/10'
                  : 'border-az-glass-border bg-az-glass-fill hover:border-az-glass-border-hover'
              }`}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-az-control bg-az-flame/15 text-az-flame">
                <role.icon size={20} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="az-body-strong block text-az-ink">{role.title}</span>
                <span className="az-caption block text-az-ink/60">
                  {role.description} · {role.sub}
                </span>
              </span>
              <span className="az-caption shrink-0 text-az-ink-muted">
                {pending ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner /> Selecting
                  </span>
                ) : (
                  'Select'
                )}
              </span>
            </button>
          );
        })}
      </div>
    </AuthShell>
  );
}
