'use client';

import { useState, useEffect } from 'react';
import { fetchAgbalaStoryworlds } from '../api';
import type { AgbalaStoryworld } from '../types';

export function useAgbalaStoryworlds() {
  const [storyworlds, setStoryworlds] = useState<AgbalaStoryworld[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAgbalaStoryworlds();
        setStoryworlds(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load storyworlds');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { storyworlds, loading, error };
}
