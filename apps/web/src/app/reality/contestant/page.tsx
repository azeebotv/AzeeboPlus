'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface Contestant {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  avatar: string;
  coverImage: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  stats: {
    votes: number;
    rank: number;
    episodes: number;
  };
  isFavorite: boolean;
}

export default function ContestantProfilePage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contestantId = searchParams.get('id') || '';

  const [contestant, setContestant] = useState<Contestant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [showVoteModal, setShowVoteModal] = useState<boolean>(false);

  useEffect(() => {
    loadContestant();
  }, [contestantId]);

  const loadContestant = async (): Promise<void> => {
    try {
      const result = await apiFetch<Contestant>(`/v1/content/contestants/${contestantId}`);

      if (result.success && result.data) {
        setContestant(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load contestant', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (isSuper: boolean): Promise<void> => {
    if (!contestant) return;

    setIsVoting(true);
    try {
      const result = await apiFetch<unknown>('/v1/content/vote', {
        method: 'POST',
        body: JSON.stringify({
          contestantId,
          isSuperVote: isSuper,
        }),
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to submit vote');
      }

      setShowVoteModal(false);
      alert(`Your ${isSuper ? 'Super ' : ''}vote for ${contestant.name} has been submitted!`);
      loadContestant();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!contestant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground text-xl mb-4">Contestant not found</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-primary text-white rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <div className="h-64 bg-gradient-to-r from-purple-600 to-blue-600 relative">
            <img
              src={contestant.coverImage}
              alt={contestant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>

          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70"
          >
            ←
          </button>
        </div>

        <div className="px-6 -mt-20 relative">
          <img
            src={contestant.avatar}
            alt={contestant.name}
            className="w-32 h-32 rounded-full border-4 border-background"
          />

          <div className="mt-4">
            <h1 className="text-3xl font-bold text-foreground">{contestant.name}</h1>
            <p className="text-muted-foreground mt-1">
              📍 {contestant.location} • Age {contestant.age}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-card p-4 rounded-lg border border-border text-center">
              <p className="text-2xl font-bold text-primary">
                {contestant.stats.votes.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Votes</p>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border text-center">
              <p className="text-2xl font-bold text-primary">#{contestant.stats.rank}</p>
              <p className="text-sm text-muted-foreground mt-1">Rank</p>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border text-center">
              <p className="text-2xl font-bold text-primary">{contestant.stats.episodes}</p>
              <p className="text-sm text-muted-foreground mt-1">Episodes</p>
            </div>
          </div>

          <button
            onClick={() => setShowVoteModal(true)}
            disabled={isVoting}
            className="w-full mt-6 py-4 bg-primary text-white rounded-lg font-semibold text-lg hover:bg-primary/90 disabled:opacity-50"
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
              `🗳 Vote for ${contestant.name}`
            )}
          </button>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">About</h2>
            <p className="text-muted-foreground leading-relaxed">{contestant.bio}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">Social Media</h2>
            <div className="space-y-2">
              {contestant.socialLinks.instagram && (
                <a
                  href={contestant.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-card border border-border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <span className="text-foreground font-medium">📷 Instagram</span>
                </a>
              )}
              {contestant.socialLinks.twitter && (
                <a
                  href={contestant.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-card border border-border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <span className="text-foreground font-medium">🐦 Twitter</span>
                </a>
              )}
              {contestant.socialLinks.tiktok && (
                <a
                  href={contestant.socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-card border border-border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <span className="text-foreground font-medium">🎵 TikTok</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {showVoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Vote for {contestant.name}
            </h3>
            <p className="text-muted-foreground mb-6">Choose your voting option:</p>
            <div className="space-y-3">
              <button
                onClick={() => handleVote(false)}
                className="w-full py-3 px-4 bg-card border border-border text-foreground rounded-lg hover:bg-accent font-medium"
              >
                Regular Vote (1x)
              </button>
              <button
                onClick={() => handleVote(true)}
                className="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
              >
                Super Vote (2x)
              </button>
              <button
                onClick={() => setShowVoteModal(false)}
                className="w-full py-3 px-4 text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
