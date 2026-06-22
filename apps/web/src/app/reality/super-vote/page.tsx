'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { webLogger } from '@/lib/logger';
import { apiFetch } from '@/lib/api';

interface Contestant {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  rank: number;
}

interface VotePackage {
  id: string;
  name: string;
  votes: number;
  price: number;
  description: string;
  isPopular?: boolean;
}

export default function SuperVotePage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const episodeId = searchParams.get('episodeId') || '';

  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const votePackages: VotePackage[] = [
    {
      id: 'pkg1',
      name: 'Single Vote',
      votes: 1,
      price: 100,
      description: '1 Super Vote (2x weight)',
    },
    {
      id: 'pkg2',
      name: 'Power Pack',
      votes: 5,
      price: 450,
      description: '5 Super Votes (2x weight each)',
      isPopular: true,
    },
    {
      id: 'pkg3',
      name: 'Ultimate Pack',
      votes: 10,
      price: 800,
      description: '10 Super Votes (2x weight each)',
    },
    {
      id: 'pkg4',
      name: 'Mega Pack',
      votes: 25,
      price: 1800,
      description: '25 Super Votes (2x weight each)',
    },
  ];

  useEffect(() => {
    loadData();
  }, [episodeId]);

  const loadData = async (): Promise<void> => {
    try {
      const [contestantsResult, walletResult] = await Promise.all([
        apiFetch<Contestant[]>(`/v1/content/episodes/${episodeId}/contestants`),
        apiFetch<{ balance: number }>('/v1/wallet/balance'),
      ]);

      if (contestantsResult.success && contestantsResult.data) {
        setContestants(contestantsResult.data);
      }

      if (walletResult.success && walletResult.data) {
        setWalletBalance(walletResult.data.balance);
      }
    } catch (error) {
      webLogger.error('Failed to load data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (): Promise<void> => {
    if (!selectedContestant || !selectedPackage) {
      alert('Please select a contestant and vote package');
      return;
    }

    const package_ = votePackages.find((p) => p.id === selectedPackage);
    if (!package_) return;

    if (walletBalance < package_.price) {
      if (
        confirm(
          `You need ₦${package_.price.toLocaleString()} but your balance is ₦${walletBalance.toLocaleString()}. Add funds to your wallet?`
        )
      ) {
        router.push('/wallet/add-funds');
      }
      return;
    }

    if (
      !confirm(
        `Purchase ${package_.votes} Super Vote(s) for ₦${package_.price.toLocaleString()} and vote for ${contestants.find((c) => c.id === selectedContestant)?.name}?`
      )
    ) {
      return;
    }

    setIsVoting(true);
    try {
      const result = await apiFetch('/v1/content/super-vote', {
        method: 'POST',
        body: JSON.stringify({
          contestantId: selectedContestant,
          episodeId,
          voteCount: package_.votes,
        }),
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to submit super vote');
      }

      alert(`Your ${package_.votes} Super Vote(s) have been submitted! Each vote counts as 2x.`);
      setSelectedContestant(null);
      setSelectedPackage(null);
      loadData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to submit super vote');
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Super Vote</h1>
              <p className="text-primary mt-1">2x Voting Power</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-2xl font-bold text-foreground">
                ₦{walletBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Select Contestant</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {contestants.map((contestant) => (
              <button
                key={contestant.id}
                onClick={() => setSelectedContestant(contestant.id)}
                className={`bg-card rounded-lg border-2 p-4 text-center transition-all ${
                  selectedContestant === contestant.id
                    ? 'border-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <img
                  src={contestant.avatar}
                  alt={contestant.name}
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                />
                <h3 className="text-sm font-semibold text-foreground mb-1">{contestant.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Rank #{contestant.rank} • {contestant.votes.toLocaleString()} votes
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Select Vote Package</h2>
          <div className="space-y-3">
            {votePackages.map((package_) => (
              <button
                key={package_.id}
                onClick={() => setSelectedPackage(package_.id)}
                className={`w-full bg-card rounded-lg border-2 p-4 text-left transition-all relative ${
                  selectedPackage === package_.id
                    ? 'border-primary'
                    : 'border-border hover:border-primary/50'
                } ${package_.isPopular ? 'border-primary bg-purple-900/20' : ''}`}
              >
                {package_.isPopular && (
                  <span className="absolute -top-3 right-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{package_.name}</h3>
                    <p className="text-sm text-muted-foreground">{package_.description}</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    ₦{package_.price.toLocaleString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleVote}
          disabled={!selectedContestant || !selectedPackage || isVoting}
          className="w-full py-4 bg-primary text-white rounded-lg font-semibold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVoting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : (
            '🗳 Submit Super Vote'
          )}
        </button>
      </div>
    </div>
  );
}
