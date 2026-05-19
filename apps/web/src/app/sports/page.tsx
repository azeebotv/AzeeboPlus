'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Skeleton, Badge, Avatar } from '@azeebo/ui';
import { colors, gradients, universeColors } from '@azeebo/design-tokens';
import Link from 'next/link';

const mockMatches = [
  {
    id: '1',
    team1: 'Super Eagles',
    team2: 'Black Stars',
    date: 'Today, 7:00 PM',
    venue: 'Lagos National Stadium',
    team1Logo: 'SE',
    team2Logo: 'BS',
    isLive: true,
    score1: 1,
    score2: 0,
  },
  {
    id: '2',
    team1: 'Bafana Bafana',
    team2: 'Indomitable Lions',
    date: 'Tomorrow, 5:00 PM',
    venue: 'Johannesburg Stadium',
    team1Logo: 'BB',
    team2Logo: 'IL',
    isLive: false,
    score1: null,
    score2: null,
  },
  {
    id: '3',
    team1: 'Atlas Lions',
    team2: 'Desert Foxes',
    date: 'Dec 20, 8:00 PM',
    venue: 'Casablanca Stadium',
    team1Logo: 'AL',
    team2Logo: 'DF',
    isLive: false,
    score1: null,
    score2: null,
  },
];

const mockPredictions = [
  {
    id: '1',
    question: 'Who will win Super Eagles vs Black Stars?',
    options: ['Super Eagles', 'Black Stars', 'Draw'],
    endTime: '2h 30m left',
  },
  {
    id: '2',
    question: 'How many goals will be scored in total?',
    options: ['0-1', '2-3', '4-5', '6+'],
    endTime: '2h 30m left',
  },
];

export default function SportsPage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [matches, setMatches] = useState(mockMatches);
  const [predictions, setPredictions] = useState(mockPredictions);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: universeColors.sports.primary }}>
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1 className="text-2xl font-bold hidden sm:block" style={{ color: colors.text.primary }}>Azeebo+</h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Browse', 'Library', 'Creators', 'Sports'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : item === 'Sports' ? '/sports' : `/${item.toLowerCase()}`}
                className="text-base font-medium transition-colors"
                style={{ color: item === 'Sports' ? universeColors.sports.primary : colors.text.secondary }}
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar size="medium" fallback={user?.name?.charAt(0) || 'U'} />
                  <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{user?.name}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - Live Match */}
      <section className="relative">
        {isLoading ? (
          <Skeleton height="500px" className="w-full" />
        ) : (
          <div className="relative h-[500px]" style={{ background: `linear-gradient(135deg, ${universeColors.sports.primary}, ${universeColors.sports.secondary})` }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                {matches[0].isLive && (
                  <Badge variant="error" className="mb-6">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></span>
                    LIVE NOW
                  </Badge>
                )}
                <div className="flex items-center justify-center gap-8 mb-6">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-4">
                      <span className="text-white text-3xl font-bold">{matches[0].team1Logo}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{matches[0].team1}</h3>
                  </div>
                  <div className="text-center">
                    {matches[0].isLive ? (
                      <div className="text-6xl font-bold text-white">
                        {matches[0].score1} - {matches[0].score2}
                      </div>
                    ) : (
                      <div className="text-4xl font-bold text-white/70">VS</div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-4">
                      <span className="text-white text-3xl font-bold">{matches[0].team2Logo}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{matches[0].team2}</h3>
                  </div>
                </div>
                <p className="text-white/80 text-lg mb-6">{matches[0].venue}</p>
                <div className="flex items-center justify-center gap-4">
                  <Button size="lg" variant="secondary">
                    <span>▶️</span> Watch Live
                  </Button>
                  <Button size="lg" style={{ backgroundColor: 'white', color: universeColors.sports.primary }}>
                    <span>🎯</span> Make Prediction
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Upcoming Matches */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
              Upcoming Matches
            </h2>
            <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
              Don\'t miss the action
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {matches.slice(1).map((match) => (
            <Card key={match.id} padding="md" className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-2">
                    <span className="text-white text-xl font-bold">{match.team1Logo}</span>
                  </div>
                  <span className="text-sm" style={{ color: colors.text.primary }}>{match.team1}</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold" style={{ color: colors.text.secondary }}>VS</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-2">
                    <span className="text-white text-xl font-bold">{match.team2Logo}</span>
                  </div>
                  <span className="text-sm" style={{ color: colors.text.primary }}>{match.team2}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm" style={{ color: colors.text.secondary }}>{match.date}</p>
                <p className="text-xs text-gray-500">{match.venue}</p>
                <Button variant="outline" className="mt-2">
                  Predict
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Prediction Market */}
      <section className="py-12" style={{ backgroundColor: colors.bg.secondary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
                Prediction Market
              </h2>
              <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
                Predict and win rewards
              </p>
            </div>
            <Button variant="ghost">View All</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {predictions.map((prediction) => (
              <Card key={prediction.id} padding="md">
                <h3 className="text-lg font-bold mb-4" style={{ color: colors.text.primary }}>{prediction.question}</h3>
                <p className="text-sm mb-4" style={{ color: colors.text.tertiary }}>⏰ {prediction.endTime}</p>
                <div className="grid grid-cols-2 gap-3">
                  {prediction.options.map((option, idx) => (
                    <Button key={idx} variant="outline" className="justify-start">
                      {option}
                    </Button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12" style={{ borderColor: colors.border.light, backgroundColor: colors.bg.secondary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Azeebo+</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['About', 'Careers', 'Press'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Help</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Support', 'FAQ', 'Contact'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Legal</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Terms', 'Privacy', 'Cookies'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Connect</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Twitter', 'Instagram', 'Facebook'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm" style={{ borderColor: colors.border.light, color: colors.text.tertiary }}>
            <p>© 2026 Azeebo+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
