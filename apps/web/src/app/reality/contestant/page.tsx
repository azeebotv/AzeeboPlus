'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { webLogger } from '../../../lib/logger';
import { OptimizedImage } from '@/components/OptimizedImage';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

interface ContestantDetail {
  id: string;
  name: string;
  avatar: string;
  coverImage: string;
  bio: string;
  age: number;
  location: string;
  stats: { votes: number; rank: number; episodes: number };
  socialLinks: { instagram?: string; twitter?: string; tiktok?: string };
}

export default function ContestantProfilePage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contestantId = searchParams.get('id') || '';
  const [contestant, setContestant] = useState<ContestantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const fetchContestant = async () => {
      if (!contestantId) {
        setIsLoading(false);
        return;
      }
      try {
        const result = await apiFetch<ContestantDetail>(`/v1/content/contestant/${contestantId}`);
        if (result.success && result.data) {
          setContestant(result.data);
        }
      } catch (error) {
        webLogger.error('Failed to load contestant', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContestant();
  }, [contestantId]);

  const handleVote = async (isSuper: boolean): Promise<void> => {
    setIsVoting(true);
    try {
      const result = await apiFetch('/reality/votes', {
        method: 'POST',
        body: JSON.stringify({ contestantId, isSuperVote: isSuper }),
      });
      if (!result.success) throw new Error(result.message || 'Failed to submit vote');
      setShowVoteModal(false);
      alert(`Your ${isSuper ? 'Super ' : ''}vote has been submitted!`);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 mx-auto"
              style={{
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: 'var(--brand-orange)',
              }}
            />
            <p className="mt-4 text-white/60">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!contestant) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <div className="text-center">
            <p className="text-white text-xl mb-4">Contestant not found</p>
            <button
              onClick={() => router.back()}
              className="az-btn-primary"
              style={{ width: 'auto', paddingInline: '1.5rem' }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader />
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <div
            className="h-64 relative"
            style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
          >
            <OptimizedImage
              src={contestant.coverImage}
              alt={contestant.name}
              fill
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/50 to-transparent" />
          </div>
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 rounded-full w-10 h-10 flex items-center justify-center text-white transition-colors"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            ←
          </button>
        </div>

        <div className="px-6 -mt-20 relative">
          <OptimizedImage
            src={contestant.avatar}
            alt={contestant.name}
            width={128}
            height={128}
            className="w-32 h-32 rounded-full border-4"
            style={{ borderColor: '#1A0A0A' }}
          />
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-white">{contestant.name}</h1>
            <p className="text-white/50 mt-1">
              📍 {contestant.location} • Age {contestant.age}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: 'Votes', value: contestant.stats.votes.toLocaleString() },
              { label: 'Rank', value: `#${contestant.stats.rank}` },
              { label: 'Episodes', value: contestant.stats.episodes },
            ].map((stat) => (
              <div key={stat.label} className="az-glass p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: 'var(--brand-orange)' }}>
                  {stat.value}
                </p>
                <p className="text-sm text-white/50 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowVoteModal(true)}
            disabled={isVoting}
            className="w-full mt-6 py-4 rounded-full font-semibold text-lg transition-all az-btn-primary disabled:opacity-50"
          >
            {isVoting ? 'Processing...' : `🗳 Vote for ${contestant.name}`}
          </button>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-3">About</h2>
            <p className="text-white/50 leading-relaxed">{contestant.bio}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-3">Social Media</h2>
            <div className="space-y-2">
              {contestant.socialLinks.instagram && (
                <a
                  href={contestant.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block az-glass p-4 transition-colors hover:scale-[1.01]"
                >
                  <span className="text-white font-medium">📷 Instagram</span>
                </a>
              )}
              {contestant.socialLinks.twitter && (
                <a
                  href={contestant.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block az-glass p-4 transition-colors hover:scale-[1.01]"
                >
                  <span className="text-white font-medium">🐦 Twitter</span>
                </a>
              )}
              {contestant.socialLinks.tiktok && (
                <a
                  href={contestant.socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block az-glass p-4 transition-colors hover:scale-[1.01]"
                >
                  <span className="text-white font-medium">🎵 TikTok</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {showVoteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Vote for ${contestant.name}`}
        >
          <div className="az-glass rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-2">Vote for {contestant.name}</h3>
            <p className="text-white/50 mb-6">Choose your voting option:</p>
            <div className="space-y-3">
              <button
                onClick={() => handleVote(false)}
                className="w-full py-3 px-4 rounded-full font-medium transition-colors"
                style={{
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: 'var(--brand-white)',
                }}
              >
                Regular Vote (1x)
              </button>
              <button
                onClick={() => handleVote(true)}
                className="w-full py-3 px-4 rounded-full font-medium transition-colors az-btn-primary"
              >
                Super Vote (2x)
              </button>
              <button
                onClick={() => setShowVoteModal(false)}
                className="w-full py-3 px-4 text-white/50 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <AppFooter />
    </div>
  );
}
