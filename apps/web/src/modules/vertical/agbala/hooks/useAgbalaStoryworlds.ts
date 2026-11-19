'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAgbalaStoryworlds } from '../api';
import type { AgbalaStoryworld } from '../types';

export function useAgbalaStoryworlds() {
  const [storyworlds, setStoryworlds] = useState<AgbalaStoryworld[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAgbalaStoryworlds();
      setStoryworlds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load storyworlds');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { storyworlds, loading, error, refetch: load };
}
