'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Laptop, Users } from 'lucide-react';
import { webLogger } from '@/lib/logger';
import { apiFetch } from '@/lib/api';
import AuthShell from '@/components/auth/AuthShell';
import { Alert, Spinner } from '@/components/auth/FormBits';

type Role = 'user' | 'creator' | 'both';

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
    sub: 'Showcase your talent, reach millions and connect',
  },
  {
    id: 'both',
    title: 'Creator & User',
    icon: Laptop,
    description: 'Experience the best of both worlds',
    sub: 'Consume content and create your journey',
  },
];

export default function RoleSelectionPage(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Role | null>(null);
  const router = useRouter();

  const handleRoleSelection = async (role: Role): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setActive(role);
    try {
      const result = await apiFetch('/v1/auth/select-role', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      if (!result.success) {
        throw new Error(result.message || 'Failed to select role');
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
