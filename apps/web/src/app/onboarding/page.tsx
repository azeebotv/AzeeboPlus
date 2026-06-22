'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUniverses } from '@/hooks/useDatabase';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

export default function OnboardingPage() {
  const router = useRouter();
  const { universes, isLoading: universesLoading } = useUniverses();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleComplete = async () => {
    try {
      // Auth is handled via HttpOnly cookies sent with credentials: 'include'
      await apiFetch('/user/preferences', {
        method: 'PUT',
        body: JSON.stringify({ interests: selectedInterests, onboardingCompleted: true }),
      });
      localStorage.setItem('onboardingCompleted', 'true');
      router.push('/');
    } catch (error) {
      webLogger.error('Failed to save preferences', error);
      router.push('/');
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <div className="relative w-48 h-48 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-pulse" />
            <div className="absolute inset-4 rounded-full border-2 border-indigo-400/20 animate-pulse delay-100" />
            <div className="absolute inset-8 rounded-full border-2 border-pink-400/10 animate-pulse delay-200" />
            <span className="absolute inset-0 flex items-center justify-center text-6xl">🎬</span>
          </div>

          <h1 className="text-5xl font-bold text-white mb-4">Welcome to Azeebo+</h1>
          <p className="text-xl text-gray-300 mb-12 max-w-lg mx-auto">
            Discover endless entertainment across {universes.length} amazing universes. Reality
            shows, creators, movies, games, and more!
          </p>

          <div className="grid grid-cols-4 gap-6 mb-12">
            {universesLoading ? (
              <div className="col-span-4 text-center text-white">Loading...</div>
            ) : (
              universes.slice(0, 8).map((universe) => (
                <div key={universe.id} className="text-center">
                  <span className="text-4xl block mb-2">{universe.icon || '🎬'}</span>
                  <span className="text-sm text-gray-300 font-medium">{universe.displayName}</span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setStep(2)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-4 rounded-xl text-lg font-semibold transition-colors"
          >
            Get Started
          </button>

          <div className="mt-6">
            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">What interests you?</h1>
          <p className="text-lg text-gray-300">
            Select at least 3 topics to personalize your experience
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {universesLoading ? (
            <div className="col-span-full text-center text-white py-12">Loading interests...</div>
          ) : (
            universes.map((universe) => (
              <button
                key={universe.id}
                onClick={() => toggleInterest(universe.name)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  selectedInterests.includes(universe.name)
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-white/10 border-transparent text-gray-300 hover:bg-white/20'
                }`}
              >
                <span className="text-3xl">{universe.icon || '🎬'}</span>
                <span className="font-semibold">{universe.displayName}</span>
              </button>
            ))
          )}
        </div>

        <div className="text-center">
          <p className="text-gray-400 mb-4">
            {selectedInterests.length} selected
            {selectedInterests.length >= 3 && (
              <span className="text-green-400 font-semibold ml-2">- Ready!</span>
            )}
          </p>
          <button
            onClick={handleComplete}
            disabled={selectedInterests.length < 3}
            className={`px-12 py-4 rounded-xl text-lg font-semibold transition-colors ${
              selectedInterests.length >= 3
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue to Azeebo+
          </button>
        </div>
      </div>
    </div>
  );
}
