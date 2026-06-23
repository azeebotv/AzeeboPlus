'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { webLogger } from '../../../lib/logger';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

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
  isPopular: boolean;
}

export default function SuperVotePage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const episodeId = searchParams.get('episodeId') || '';
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);

  const votePackages: VotePackage[] = [
    { id: 'pkg-10', name: '10 Super Votes', votes: 10, price: 500, description: '10 votes at 2x power', isPopular: false },
    { id: 'pkg-25', name: '25 Super Votes', votes: 25, price: 1000, description: '25 votes at 2x power + bonus', isPopular: true },
    { id: 'pkg-50', name: '50 Super Votes', votes: 50, price: 1800, description: '50 votes at 2x power + big bonus', isPopular: false },
    { id: 'pkg-100', name: '100 Super Votes', votes: 100, price: 3000, description: '100 votes at 2x power + mega bonus', isPopular: false },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [contestantsResult, walletResult] = await Promise.all([
          apiFetch<Contestant[]>(`/v1/content/${episodeId}/contestants`),
          apiFetch<{ balance: number }>('/v1/wallet/balance'),
        ]);
        if (contestantsResult.success && contestantsResult.data) setContestants(contestantsResult.data);
        if (walletResult.success && walletResult.data) setWalletBalance(walletResult.data.balance);
      } catch (error) { webLogger.error('Failed to load data', error); }
      finally { setIsLoading(false); }
    };
    loadData();
  }, [episodeId]);

  const handleVote = async (): Promise<void> => {
    if (!selectedContestant || !selectedPackage) { alert('Please select a contestant and vote package'); return; }
    const pkg = votePackages.find((p) => p.id === selectedPackage);
    if (!pkg) return;
    if (walletBalance < pkg.price) {
      if (confirm(`You need ₦${pkg.price.toLocaleString()} but your balance is ₦${walletBalance.toLocaleString()}. Add funds?`)) router.push('/wallet/add-funds');
      return;
    }
    if (!confirm(`Purchase ${pkg.votes} Super Vote(s) for ₦${pkg.price.toLocaleString()}?`)) return;
    setIsVoting(true);
    try {
      const result = await apiFetch('/v1/content/super-vote', { method: 'POST', body: JSON.stringify({ contestantId: selectedContestant, episodeId, voteCount: pkg.votes }) });
      if (!result.success) throw new Error(result.message || 'Failed to submit super vote');
      alert(`Your ${pkg.votes} Super Vote(s) submitted! Each counts as 2x.`);
      setSelectedContestant(null);
      setSelectedPackage(null);
    } catch (error: unknown) { alert(error instanceof Error ? error.message : 'Failed to submit super vote'); }
    finally { setIsVoting(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
        <AppHeader />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 mx-auto" style={{ border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#E8420A' }} />
            <p className="mt-4 text-white/60">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader />
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button onClick={() => router.back()} className="text-white/50 hover:text-white mb-4 flex items-center gap-2 transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Super Vote</h1>
              <p className="mt-1" style={{ color: '#E8420A' }}>2x Voting Power</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/50">Balance</p>
              <p className="text-2xl font-bold text-white">₦{walletBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Select Contestant</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" role="radiogroup" aria-label="Select contestant">
            {contestants.map((contestant) => (
              <button
                key={contestant.id}
                onClick={() => setSelectedContestant(contestant.id)}
                role="radio"
                aria-checked={selectedContestant === contestant.id}
                className={`az-glass p-4 text-center transition-all rounded-xl ${
                  selectedContestant === contestant.id ? 'ring-2' : ''
                }`}
                style={selectedContestant === contestant.id ? { borderColor: '#E8420A', boxShadow: '0 0 20px rgba(232,66,10,0.3)' } : undefined}
              >
                <img src={contestant.avatar} alt={contestant.name} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover" />
                <h3 className="text-sm font-semibold text-white mb-1">{contestant.name}</h3>
                <p className="text-xs text-white/50">Rank #{contestant.rank} • {contestant.votes.toLocaleString()} votes</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Select Vote Package</h2>
          <div className="space-y-3" role="radiogroup" aria-label="Select vote package">
            {votePackages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                role="radio"
                aria-checked={selectedPackage === pkg.id}
                className={`w-full az-glass p-4 text-left transition-all relative rounded-xl ${
                  selectedPackage === pkg.id ? 'ring-2' : ''
                }`}
                style={selectedPackage === pkg.id ? { boxShadow: '0 0 20px rgba(232,66,10,0.3)' } : undefined}
              >
                {pkg.isPopular && (
                  <span className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#E8420A' }}>Most Popular</span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
                    <p className="text-sm text-white/50">{pkg.description}</p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#E8420A' }}>₦{pkg.price.toLocaleString()}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleVote}
          disabled={!selectedContestant || !selectedPackage || isVoting}
          className="w-full py-4 rounded-full font-semibold text-lg transition-all az-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVoting ? 'Processing...' : '🗳 Submit Super Vote'}
        </button>
      </div>
      <AppFooter />
    </div>
  );
}
