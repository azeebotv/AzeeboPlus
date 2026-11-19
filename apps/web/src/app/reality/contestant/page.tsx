'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import { webLogger } from '../../../lib/logger';
import { OptimizedImage } from '@/components/OptimizedImage';
import PageShell from '@/components/layout/PageShell';

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
      <PageShell maxWidth="lg">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div
              className="mx-auto size-12 animate-spin rounded-full border-[3px] border-az-glass-border-hover border-t-az-flame"
              role="status"
              aria-label="Loading profile"
            />
            <p className="az-body mt-4 text-az-ink/60">Loading profile...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!contestant) {
    return (
      <PageShell maxWidth="lg">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h1 className="az-title mb-4 text-az-ink">Contestant not found</h1>
            <button
              type="button"
              onClick={() => router.back()}
              className="az-btn-primary az-btn-primary--inline"
            >
              Go Back
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="lg">
      <div className="relative">
        <div className="relative h-64 overflow-hidden rounded-az-feature bg-gradient-to-br from-az-flame to-az-scarlet">
          <OptimizedImage
            src={contestant.coverImage}
            alt={contestant.name}
            fill
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 az-scrim" />
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-full bg-az-surface-root/50 text-az-ink transition-colors hover:bg-az-surface-root/70"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="-mt-20 relative px-6">
        <OptimizedImage
          src={contestant.avatar}
          alt={contestant.name}
          width={128}
          height={128}
          className="size-32 rounded-full border-4 border-az-surface-root"
        />
        <div className="mt-4">
          <h1 className="az-heading text-az-ink">{contestant.name}</h1>
          <p className="az-body mt-1 text-az-ink-muted">
            {contestant.location} • Age {contestant.age}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: 'Votes', value: contestant.stats.votes.toLocaleString() },
            { label: 'Rank', value: `#${contestant.stats.rank}` },
            { label: 'Episodes', value: contestant.stats.episodes },
          ].map((stat) => (
            <div key={stat.label} className="az-glass p-4 text-center">
              <p className="az-section-title text-az-flame">{stat.value}</p>
              <p className="az-body mt-1 text-az-ink-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowVoteModal(true)}
          disabled={isVoting}
          className="mt-6 az-btn-primary"
        >
          {isVoting ? 'Processing...' : `Vote Vote for ${contestant.name}`}
        </button>

        <div className="mt-8">
          <h2 className="az-title mb-3 text-az-ink">About</h2>
          <p className="az-body leading-relaxed text-az-ink-muted">{contestant.bio}</p>
        </div>

        <div className="mt-8">
          <h2 className="az-title mb-3 text-az-ink">Social Media</h2>
          <div className="space-y-2">
            {contestant.socialLinks.instagram && (
              <a
                href={contestant.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="az-glass block p-4 transition-colors hover:scale-[1.01]"
              >
                <span className="az-body-strong text-az-ink">CameraInstagram</span>
              </a>
            )}
            {contestant.socialLinks.twitter && (
              <a
                href={contestant.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="az-glass block p-4 transition-colors hover:scale-[1.01]"
              >
                <span className="az-body-strong text-az-ink">BirdTwitter</span>
              </a>
            )}
            {contestant.socialLinks.tiktok && (
              <a
                href={contestant.socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="az-glass block p-4 transition-colors hover:scale-[1.01]"
              >
                <span className="az-body-strong text-az-ink">Music2TikTok</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {showVoteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-az-surface-root/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Vote for ${contestant.name}`}
        >
          <div className="az-glass w-full max-w-md p-6">
            <h3 className="az-title mb-2 text-az-ink">Vote for {contestant.name}</h3>
            <p className="az-body mb-6 text-az-ink-muted">Choose your voting option:</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleVote(false)}
                className="az-chip az-body-strong w-full px-4 py-3 text-az-ink transition-colors"
              >
                Regular Vote (1x)
              </button>
              <button type="button" onClick={() => handleVote(true)} className="az-btn-primary">
                Super Vote (2x)
              </button>
              <button
                type="button"
                onClick={() => setShowVoteModal(false)}
                className="az-body w-full px-4 py-3 text-az-ink-muted transition-colors hover:text-az-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
