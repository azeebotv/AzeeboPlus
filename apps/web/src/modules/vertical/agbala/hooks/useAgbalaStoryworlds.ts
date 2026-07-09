'use client';

import { useState, useEffect } from 'react';
import { fetchAgbalaStoryworlds } from '../api';

export function useAgbalaStoryworlds() {
  const [storyworlds, setStoryworlds] = useState<any[]>([]);
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
