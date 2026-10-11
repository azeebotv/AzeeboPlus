'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import { PageShell } from '@/components/layout/PageShell';

export default function ShareRedirectPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const code = params?.code as string;
    if (!code) {
      setError(true);
      return;
    }

    const resolve = async () => {
      try {
        const result = await apiFetch<{ contentId: string; redirectUrl: string }>(
          `/content/sharing/resolve/${code}`
        );
        if (result.success && result.data) {
          router.replace(result.data.redirectUrl);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };

    resolve();
  }, [params, router]);

  if (error) {
    return (
      <PageShell maxWidth="sm">
        <div className="az-glass p-8 text-center">
          <h1 className="az-title mb-2 text-az-ink">Link not found</h1>
          <p className="az-body text-az-ink-muted">
            This share link may have expired or been removed.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="sm">
      <div className="text-center">
        <Loader className="mx-auto mb-4 size-8 animate-spin text-az-flame" />
        <p className="az-body text-az-ink-muted">Redirecting...</p>
      </div>
    </PageShell>
  );
}
