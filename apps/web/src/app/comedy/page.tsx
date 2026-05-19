'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Skeleton, Badge, Avatar } from '@azeebo/ui';
import { colors, gradients } from '@azeebo/design-tokens';
import Link from 'next/link';

const mockClips = [
  {
    id: '1',
    title: 'When Your Mom Finds Your Phone',
    comedian: 'Apatroot',
    views: '2.5M',
    likes: '128K',
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=funny%20african%20comedy%20skit%20scene%20with%20exaggerated%20expressions&image_size=landscape_16_9',
    duration: '4:32',
  },
  {
    id: '2',
    title: 'Nigerian Parents vs Technology',
    comedian: 'Taaooma',
    views: '1.8M',
    likes: '95K',
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=comedy%20skit%20showing%20generation%20gap%20with%20technology&image_size=landscape_16_9',
    duration: '5:45',
  },
  {
    id: '3',
    title: 'How Lagosians React to Traffic',
    comedian: 'Zics',
    views: '1.2M',
    likes: '67K',
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=funny%20traffic%20scene%20in%20lagos%20nigeria%20with%20humorous%20characters&image_size=landscape_16_9',
    duration: '3:18',
  },
  {
    id: '4',
    title: 'School Memories We All Have',
    comedian: 'Nigerian Zoomer',
    views: '980K',
    likes: '54K',
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=nigerian%20school%20classroom%20comedy%20scene%20with%20students&image_size=landscape_16_9',
    duration: '4:02',
  },
];

const mockComedians = [
  { id: '1', name: 'Apatroot', followers: '3.2M', avatar: '😂', clips: 156 },
  { id: '2', name: 'Taaooma', followers: '2.8M', avatar: '🤣', clips: 98 },
  { id: '3', name: 'Zics', followers: '1.5M', avatar: '😆', clips: 72 },
  { id: '4', name: 'Nigerian Zoomer', followers: '1.1M', avatar: '🙃', clips: 45 },
];

const mockTrending = [
  { id: '1', title: '#NaijaComedyChallenge', posts: '12.5K', participants: '3.2K' },
  { id: '2', title: '#FunnyFriday', posts: '8.9K', participants: '2.1K' },
];

export default function ComedyPage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [clips, setClips] = useState(mockClips);
  const [comedians, setComedians] = useState(mockComedians);
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
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: gradients.brand }}>
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1 className="text-2xl font-bold hidden sm:block" style={{ color: colors.text.primary }}>Azeebo+</h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Browse', 'Library', 'Creators', 'Comedy'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : item === 'Comedy' ? '/comedy' : `/${item.toLowerCase()}`}
                className="text-base font-medium transition-colors"
                style={{ color: item === 'Comedy' ? '#F39C12' : colors.text.secondary }}
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
      <section className="relative py-16" style={{ background: 'linear-gradient(135deg, #F39C12 0%, #E67E22 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">😂 Comedy Universe</h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Laugh out loud with the best African comedy content. From hilarious skits to stand-up specials.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary">
                <span>🎬</span> Browse Comedy
              </Button>
              <Button size="lg" variant="ghost" style={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <span>🎤</span> Submit Your Clip
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Challenges */}
      <section className="py-8" style={{ backgroundColor: colors.bg.secondary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {mockTrending.map((trend) => (
              <Card key={trend.id} className="flex-shrink-0" padding="none">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <span className="text-2xl">🔥</span>
                    </div>
                    <div>
                      <h4 className="font-bold" style={{ color: colors.text.primary }}>{trend.title}</h4>
                      <p className="text-sm" style={{ color: colors.text.secondary }}>
                        {trend.posts} posts • {trend.participants} participants
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Clips */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
              Trending Clips
            </h2>
            <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
              What everyone is laughing at
            </p>
          </div>
          <Button variant="ghost">View All</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {clips.map((clip) => (
            <Card key={clip.id} padding="none" className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow group">
              <div className="relative">
                <img src={clip.thumbnail} alt={clip.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                  {clip.duration}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                    <span className="text-2xl">▶️</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm mb-2 truncate" style={{ color: colors.text.primary }}>{clip.title}</h3>
                <p className="text-xs" style={{ color: colors.text.secondary }}><Link href={`/creator/${clip.comedian?.toLowerCase().replace(/\s+/g, '-')}`} className="hover:underline">{clip.comedian}</Link></p>
                <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: colors.text.secondary }}>
                  <span>👁️ {clip.views}</span>
                  <span>❤️ {clip.likes}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Top Comedians */}
      <section className="py-12" style={{ backgroundColor: colors.bg.secondary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
                Top Comedians
              </h2>
              <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
                Follow your favorite creators
              </p>
            </div>
            <Button variant="ghost">View All</Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {comedians.map((comedian) => (
              <Card key={comedian.id} className="text-center cursor-pointer hover:shadow-xl transition-shadow" padding="none">
                <div className="p-4">
                  <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">{comedian.avatar}</span>
                  </div>
                  <h3 className="font-bold" style={{ color: colors.text.primary }}>{comedian.name}</h3>
                  <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                    {comedian.followers} followers
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                    {comedian.clips} clips
                  </p>
                  <Button variant="primary" className="w-full mt-4">
                    Follow
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
              Comedy Categories
            </h2>
            <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
              Find your favorite type of comedy
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'Skits', icon: '🎭', count: '2.5K' },
            { name: 'Stand-up', icon: '🎤', count: '500' },
            { name: 'Improv', icon: '🎨', count: '300' },
            { name: 'Parodies', icon: '🎬', count: '800' },
            { name: 'Roasts', icon: '🔥', count: '200' },
            { name: 'Comedy Series', icon: '📺', count: '150' },
          ].map((category) => (
            <Card key={category.name} className="text-center cursor-pointer hover:shadow-lg transition-shadow" padding="none">
              <div className="p-4">
                <span className="text-3xl mb-2 block">{category.icon}</span>
                <h4 className="font-medium text-sm" style={{ color: colors.text.primary }}>{category.name}</h4>
                <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>{category.count} clips</p>
              </div>
            </Card>
          ))}
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
