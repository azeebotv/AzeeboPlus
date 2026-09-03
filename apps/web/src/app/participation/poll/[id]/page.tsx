'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

interface Poll {
  id: string;
  question: string;
  description?: string;
  options: PollOption[];
  totalVotes: number;
  endsAt: string;
  userVote?: string;
  isActive: boolean;
}

export default function PollDetailPage(): React.JSX.Element {
  const params = useParams();
  const pollId = params.id as string;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const {
    data: poll,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['poll', pollId],
    queryFn: async () => {
      const res = await apiFetch<Poll>(`/v1/engagement/polls/${pollId}`);
      return res.success ? res.data : null;
    },
  });

  const voteMutation = useMutation({
    mutationFn: (optionId: string) =>
      apiFetch(`/v1/engagement/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionId }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['poll', pollId] }),
  });

  if (error) {
    return (
      <>
        <AppHeader />
        <main className="min-h-screen bg-gray-950 text-white">
          <ErrorState description="Failed to load poll. Please try again." />
        </main>
        <AppFooter />
      </>
    );
  }

  const hasVoted = !!poll?.userVote;
  const isExpired = poll ? new Date(poll.endsAt) < new Date() : false;

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : poll ? (
            <>
              <h1 className="text-2xl font-bold mb-2">{poll.question}</h1>
              {poll.description && <p className="text-gray-400 mb-6">{poll.description}</p>}
              <p className="text-sm text-gray-500 mb-8">
                {poll.totalVotes} votes ·{' '}
                {isExpired ? 'Ended' : `Ends ${new Date(poll.endsAt).toLocaleDateString()}`}
              </p>

              <div className="space-y-3">
                {poll.options.map((option) => {
                  const isSelected = selectedOption === option.id || poll.userVote === option.id;
                  return (
                    <button
                      key={option.id}
                      disabled={hasVoted || isExpired || !user}
                      onClick={() => setSelectedOption(option.id)}
                      className={`w-full text-left rounded-xl p-4 border transition ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option.text}</span>
                        {hasVoted && (
                          <span className="text-sm text-gray-400">{option.percentage}%</span>
                        )}
                      </div>
                      {hasVoted && (
                        <div className="mt-2 w-full bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-amber-500 h-2 rounded-full"
                            style={{ width: `${option.percentage}%` }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {user && !hasVoted && !isExpired && selectedOption && (
                <button
                  onClick={() => voteMutation.mutate(selectedOption)}
                  disabled={voteMutation.isPending}
                  className="w-full mt-6 bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {voteMutation.isPending ? 'Submitting...' : 'Submit Vote'}
                </button>
              )}

              {!user && (
                <p className="text-center text-gray-400 mt-6">
                  <Link href="/auth/login" className="text-amber-400 hover:underline">
                    Sign in
                  </Link>{' '}
                  to vote.
                </p>
              )}
            </>
          ) : null}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
