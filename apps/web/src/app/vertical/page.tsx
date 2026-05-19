'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Skeleton, Badge, Avatar } from '@azeebo/ui';
import { colors, gradients, universeColors } from '@azeebo/design-tokens';
import Link from 'next/link';

const mockSeries = [
  {
    id: '1',
    title: 'Kingdom of Oyo',
    description: 'An epic historical drama about the ancient Oyo Empire',
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=epic%20historical%20drama%20african%20kingdom%20palace%20royalty&image_size=landscape_16_9',
    episodes: 24,
    rating: 4.8,
    isPremium: true,
    genre: 'Historical Drama',
  },
  {
    id: '2',
    title: 'Modern Love Lagos',
    description: 'A romantic anthology series exploring love in modern Lagos',
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=romantic%20drama%20lagos%20modern%20couple%20city%20night&image_size=landscape_16_9',
    episodes: 12,
    rating: 4.6,
    isPremium: false,
    genre: 'Romance',
  },
  {
    id: '3',
    title: 'Tech Bros',
    description: 'A comedy about young entrepreneurs building startups in Lagos',
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=tech%20startup%20comedy%20young%20entrepreneurs%20modern%20office&image_size=landscape_16_9',
    episodes: 18,
    rating: 4.5,
    isPremium: false,
    genre: 'Comedy',
  },
];

const mockCharacters = [
  {
    id: '1',
    name: 'King Alaafin',
    series: 'Kingdom of Oyo',
    description: 'The powerful ruler of the Oyo Empire',
    avatar: 'KA',
    lore: 'King Alaafin is the 45th ruler of the ancient Oyo Empire, known for his wisdom and military strategy.',
  },
  {
    id: '2',
    name: 'Amara',
    series: 'Modern Love Lagos',
    description: 'A successful lawyer navigating love and career',
    avatar: 'A',
    lore: 'Amara is a brilliant corporate lawyer who has to balance her demanding career with her search for true love in Lagos.',
  },
  {
    id: '3',
    name: 'Chidi',
    series: 'Tech Bros',
    description: 'A brilliant but quirky software engineer',
    avatar: 'C',
    lore: 'Chidi is a coding prodigy who dropped out of MIT to pursue his startup dream in Lagos tech scene.',
  },
];

export default function VerticalPage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [series, setSeries] = useState(mockSeries);
  const [characters, setCharacters] = useState(mockCharacters);
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
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: universeColors.vertical.primary }}>
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1 className="text-2xl font-bold hidden sm:block" style={{ color: colors.text.primary }}>Azeebo+</h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Browse', 'Library', 'Creators', 'Vertical'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : item === 'Vertical' ? '/vertical' : `/${item.toLowerCase()}`}
                className="text-base font-medium transition-colors"
                style={{ color: item === 'Vertical' ? universeColors.vertical.primary : colors.text.secondary }}
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

      {/* Hero Section */}
      <section className="relative">
        {isLoading ? (
          <Skeleton height="500px" className="w-full" />
        ) : (
          <div className="relative h-[500px]">
            <img
              src={series[0].thumbnail}
              alt={series[0].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                {series[0].isPremium && <Badge variant="success">Premium</Badge>}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-4" style={{ backgroundColor: `${universeColors.vertical.primary}30`, color: universeColors.vertical.primary }}>
                  {series[0].genre}
                </span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">{series[0].title}</h2>
              <p className="text-gray-300 text-lg mb-6 max-w-2xl">{series[0].description}</p>
              <div className="flex items-center gap-4">
                <Button size="lg" style={{ backgroundColor: universeColors.vertical.primary }}>
                  <span>▶️</span> Start Watching
                </Button>
                <Button size="lg" variant="secondary">
                  <span>📚</span> Character Lore
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Series Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
              Vertical Series
            </h2>
            <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
              Premium African storytelling
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {series.map((show) => (
            <Card key={show.id} padding="none" className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
              <div className="relative">
                <img src={show.thumbnail} alt={show.title} className="w-full h-48 object-cover" />
                {show.isPremium && (
                  <Badge variant="success" className="absolute top-2 right-2">
                    Premium
                  </Badge>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <Badge variant="outline" className="mb-2">{show.genre}</Badge>
                  <h3 className="text-xl font-bold text-white">{show.title}</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-400 mb-3">{show.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <span>🎬 {show.episodes} episodes</span>
                  <span>⭐ {show.rating}</span>
                </div>
                <Button variant="primary" className="w-full" style={{ backgroundColor: universeColors.vertical.primary }}>
                  Watch Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Character Lore */}
      <section className="py-12" style={{ backgroundColor: colors.bg.secondary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
                Character Lore
              </h2>
              <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
                Dive deeper into your favorite characters
              </p>
            </div>
            <Button variant="ghost">View All</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {characters.map((character) => (
              <Card key={character.id} padding="md" className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar size="lg" fallback={character.avatar} />
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>{character.name}</h3>
                    <Badge variant="outline">{character.series}</Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-3">{character.description}</p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>{character.lore}</p>
                <Button variant="outline" className="w-full mt-4">
                  Read Full Lore
                </Button>
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
