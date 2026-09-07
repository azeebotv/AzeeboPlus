'use client';

import { useCallback } from 'react';
import { useOffline } from '../context/OfflineContext';
import { apiFetch } from '../lib/api';

interface QueuedRequest {
  url: string;
  method: string;
  body?: unknown;
  timestamp: number;
}

const QUEUE_KEY = 'azeebo-mutation-queue';

function getQueue(): QueuedRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setQueue(queue: QueuedRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage full or unavailable
  }
}

function addToQueue(entry: QueuedRequest): void {
  const queue = getQueue();
  queue.push(entry);
  setQueue(queue);
}

// removeFromQueue available if needed for future use

export function useOfflineQueue() {
  const { isOnline, processQueue } = useOffline();

  const queueMutation = useCallback(
    async <T = unknown>(
      url: string,
      options: { method: string; body?: string | object; headers?: Record<string, string> } = {
        method: 'POST',
      }
    ): Promise<{ success: boolean; data?: T; queued: boolean }> => {
      // If online, try to send immediately
      if (isOnline) {
        try {
          const result = await apiFetch<T>(url, options as Parameters<typeof apiFetch>[1]);
          return { success: result.success, data: result.data, queued: false };
        } catch {
          // If network fails, queue it
        }
      }

      // Queue for later
      addToQueue({
        url,
        method: options.method,
        body: options.body,
        timestamp: Date.now(),
      });

      return { success: true, queued: true };
    },
    [isOnline]
  );

  const getQueuedMutations = useCallback(() => {
    return getQueue();
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const retryQueue = useCallback(async () => {
    const queue = getQueue();
    const failed: QueuedRequest[] = [];

    for (let i = 0; i < queue.length; i++) {
      const entry = queue[i];
      try {
        const result = await fetch(entry.url, {
          method: entry.method,
          headers: { 'Content-Type': 'application/json' },
          body: entry.body ? JSON.stringify(entry.body) : undefined,
        });
        if (!result.ok) {
          failed.push(entry);
        }
      } catch {
        failed.push(entry);
      }
    }

    setQueue(failed);
    processQueue();

    return { processed: queue.length - failed.length, failed: failed.length };
  }, [processQueue]);

  return {
    isOnline,
    queueMutation,
    getQueuedMutations,
    clearQueue,
    retryQueue,
    queueCount: getQueue().length,
  };
}
