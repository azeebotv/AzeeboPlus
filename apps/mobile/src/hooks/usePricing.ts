import { useState, useEffect, useCallback } from 'react';
import { pricingApi, type MoviePricing, type VotePackage, type WalletPricing, type PassPricing } from '../api/pricing';

interface UsePricingReturn {
  moviePricing: MoviePricing | null;
  votePackages: Record<string, VotePackage[]>;
  walletPricing: WalletPricing | null;
  passesPricing: PassPricing | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePricing(): UsePricingReturn {
  const [moviePricing, setMoviePricing] = useState<MoviePricing | null>(null);
  const [votePackages, setVotePackages] = useState<Record<string, VotePackage[]>>({});
  const [walletPricing, setWalletPricing] = useState<WalletPricing | null>(null);
  const [passesPricing, setPassesPricing] = useState<PassPricing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPricing = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [movieRes, standardVotes, realityVotes, superVotes, walletRes, passesRes] = await Promise.allSettled([
        pricingApi.getMoviePricing(),
        pricingApi.getVotePackages('standard'),
        pricingApi.getVotePackages('reality'),
        pricingApi.getVotePackages('superVote'),
        pricingApi.getWalletPricing(),
        pricingApi.getPassesPricing(),
      ]);

      if (movieRes.status === 'fulfilled' && movieRes.value.success && movieRes.value.data) {
        setMoviePricing(movieRes.value.data);
      }

      const packages: Record<string, VotePackage[]> = {};
      if (standardVotes.status === 'fulfilled' && standardVotes.value.success && standardVotes.value.data) {
        packages.standard = standardVotes.value.data;
      }
      if (realityVotes.status === 'fulfilled' && realityVotes.value.success && realityVotes.value.data) {
        packages.reality = realityVotes.value.data;
      }
      if (superVotes.status === 'fulfilled' && superVotes.value.success && superVotes.value.data) {
        packages.superVote = superVotes.value.data;
      }
      setVotePackages(packages);

      if (walletRes.status === 'fulfilled' && walletRes.value.success && walletRes.value.data) {
        setWalletPricing(walletRes.value.data);
      }

      if (passesRes.status === 'fulfilled' && passesRes.value.success && passesRes.value.data) {
        setPassesPricing(passesRes.value.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  return {
    moviePricing,
    votePackages,
    walletPricing,
    passesPricing,
    isLoading,
    error,
    refetch: fetchPricing,
  };
}
