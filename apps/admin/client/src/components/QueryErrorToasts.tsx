import { useCallback, useEffect, useState } from 'react';
import { useQueryClient, type Query } from '@tanstack/react-query';
import { Icon } from './Icons';

interface Toast {
  id: string;
  title: string;
  detail: string;
  retry: () => void;
}

const label = (key: unknown): string => {
  if (!Array.isArray(key)) return 'Data request';
  const leaf = key.filter((part) => typeof part === 'string' && part !== 'admin');
  const text = leaf.join(' · ');
  return text ? text : 'Data request';
};

/**
 * Global failed-read surface for the admin client.
 *
 * The client used to turn every unsuccessful response into an empty list
 * (`res.success ? … : []`), so a downed service looked like missing data. Reads
 * now throw through `requireData`, which makes the query errored — and this is
 * what makes an error visible on the ~40 pages that have no inline error
 * branch of their own.
 *
 * One toast per query key: a service that stays down must not spam the stack on
 * every refetch, and a key is released again once it succeeds.
 */
export default function QueryErrorToasts() {
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const notified = new Set<string>();

    const retry = (query: Query) => () => {
      // Rejections are expected here (that's the error we're reporting); the
      // cache listener turns the failed refetch back into a toast.
      void query.fetch().catch(() => undefined);
    };

    const push = (query: Query) => {
      const id = query.queryHash;
      if (notified.has(id)) return;
      notified.add(id);
      const error = query.state.error as Error | null;
      setToasts((list) =>
        [
          {
            id,
            title: label(query.queryKey),
            detail: error?.message ?? 'Request failed',
            retry: retry(query),
          },
          ...list,
        ].slice(0, 4)
      );
    };

    const release = (query: Query) => {
      if (!notified.has(query.queryHash)) return;
      notified.delete(query.queryHash);
      setToasts((list) => list.filter((t) => t.id !== query.queryHash));
    };

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      const query = event.query;
      if (query.state.status === 'error') push(query);
      else if (query.state.status === 'success') release(query);
    });

    return () => {
      unsubscribe();
      notified.clear();
    };
  }, [queryClient]);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 340,
        maxWidth: 'calc(100vw - 40px)',
        zIndex: 90,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: 14,
            borderRadius: 12,
            border: '1px solid rgba(204,28,28,0.45)',
            background: 'var(--admin-surface)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            fontSize: 13,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Icon name="alertTriangle" size={16} color="var(--admin-red)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ color: 'var(--admin-red)' }}>{t.title}</strong>
              <div style={{ color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Failed to load — showing this as empty is not reliable. {t.detail}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={t.retry}
                  style={{
                    border: 0,
                    background: 'transparent',
                    color: 'var(--admin-orange)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0,
                    fontSize: 12,
                  }}
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  style={{
                    border: 0,
                    background: 'transparent',
                    color: 'var(--admin-text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: 12,
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
