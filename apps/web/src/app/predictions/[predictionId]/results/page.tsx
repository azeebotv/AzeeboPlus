'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface PredictionResult {
  id: string;
  predictionId: string;
  question: string;
  correctAnswer: string;
  totalParticipants: number;
  correctParticipants: number;
  accuracyRate: number;
  pointsEarned: number;
  userAnswer: string;
  isCorrect: boolean;
  rankedPosition: number;
  rewards: Array<{
    type: 'points' | 'tokens' | 'badge';
    amount: number;
    name: string;
  }>;
}

export default function PredictionResultsPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const predictionId = params.predictionId as string;

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [predictionId]);

  const loadResults = async (): Promise<void> => {
    try {
      const result = await apiFetch<PredictionResult>(
        `/v1/reality/predictions/${predictionId}/results`
      );

      if (result.success && result.data) {
        setResult(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load prediction results', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Failed to load prediction results</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Prediction Results</h1>
          <p className="text-lg text-muted-foreground">{result.question}</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Your Answer</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                result.isCorrect ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
              }`}
            >
              {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
            </span>
          </div>
          <p className="text-xl font-semibold text-foreground mb-2">{result.userAnswer}</p>
          <p className="text-sm text-green-500">Correct: {result.correctAnswer}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {result.totalParticipants.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Participants</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {result.correctParticipants.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Correct</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-2xl font-bold text-primary">{result.accuracyRate}%</p>
            <p className="text-sm text-muted-foreground mt-1">Accuracy</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-2xl font-bold text-primary">#{result.rankedPosition}</p>
            <p className="text-sm text-muted-foreground mt-1">Your Rank</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Rewards Earned</h2>
          <div className="space-y-4">
            {result.rewards.map((reward, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {reward.type === 'points' ? '⭐' : reward.type === 'tokens' ? '🪙' : '🏆'}
                  </span>
                  <span className="text-foreground">{reward.name}</span>
                </div>
                <span className="text-lg font-semibold text-green-500">+{reward.amount}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <span className="text-lg font-semibold text-foreground">Total Points Earned</span>
            <span className="text-2xl font-bold text-yellow-500">+{result.pointsEarned}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
