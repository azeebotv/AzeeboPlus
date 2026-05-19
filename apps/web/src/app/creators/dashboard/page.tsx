'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Button, Card, Skeleton, Badge, Avatar } from '@azeebo/ui';
import { colors, gradients, universeColors } from '@azeebo/design-tokens';
import Link from 'next/link';

const mockStats = [
  { label: 'Total Views', value: '1.2M', icon: '👁️' },
  { label: 'Followers', value: '89K', icon: '👥' },
  { label: 'Videos', value: '24', icon: '🎬' },
  { label: 'Revenue', value: '₦450K', icon: '💰' },
];

const mockRecentVideos = [
  { id: '1', title: 'Behind the Scenes', views: '24K', date: '2 days ago', thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=behind%20the%20scenes%20video%20thumbnail&image_size=square' },
  { id: '2', title: 'Q&A Session', views: '18K', date: '5 days ago', thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=qa%20session%20video%20thumbnail&image_size=square' },
  { id: '3', title: 'Collaboration Special', views: '42K', date: '1 week ago', thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=collaboration%20video%20thumbnail&image_size=square' },
];

const mockRecentComments = [
  { id: '1', user: 'Fan123', comment: 'Amazing content! Love your work!', date: '2h ago' },
  { id: '2', user: 'NollywoodFan', comment: 'Can\'t wait for the next video!', date: '5h ago' },
];

export default function CreatorDashboardPage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
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
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: universeColors.creators.primary }}>
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1 className="text-2xl font-bold hidden sm:block" style={{ color: colors.text.primary }}>Creator Dashboard</h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Overview', 'Content', 'Analytics', 'Earnings', 'Settings'].map((item) => (
              <Link
                key={item}
                href={`/creators/dashboard/${item.toLowerCase()}`}
                className="text-base font-medium transition-colors"
                style={{ color: item === 'Overview' ? colors.primary[500] : colors.text.secondary }}
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
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
            Welcome back, {user?.name || 'Creator'}! 👋
          </h2>
          <p style={{ color: colors.text.secondary }}>Here\'s what\'s happening with your content.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            mockStats.map((_, idx) => <Skeleton key={idx} height="120px" className="rounded-lg" />)
          ) : (
            mockStats.map((stat, idx) => (
              <Card key={idx} padding="md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{stat.icon}</span>
                  <Badge variant="outline">+12%</Badge>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>{stat.value}</p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>{stat.label}</p>
              </Card>
            ))
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Videos */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: colors.text.primary }}>Recent Videos</h3>
              <Button variant="outline">
                <span>➕</span> Upload New
              </Button>
            </div>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} height="120px" className="rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {mockRecentVideos.map((video) => (
                  <Card key={video.id} padding="md" className="flex items-center gap-4">
                    <img src={video.thumbnail} alt={video.title} className="w-40 h-24 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="font-bold" style={{ color: colors.text.primary }}>{video.title}</h4>
                      <p className="text-sm" style={{ color: colors.text.secondary }}>👁️ {video.views} views • {video.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm">Analytics</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Comments & Quick Actions */}
          <div className="space-y-6">
            {/* Recent Comments */}
            <div>
              <h3 className="text-xl font-bold mb-6" style={{ color: colors.text.primary }}>Recent Comments</h3>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} height="80px" className="rounded-lg" />)}
                </div>
              ) : (
                <Card padding="md">
                  <div className="space-y-4">
                    {mockRecentComments.map((comment) => (
                      <div key={comment.id} className="pb-4 border-b border-gray-700 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium" style={{ color: colors.text.primary }}>{comment.user}</span>
                          <span className="text-xs" style={{ color: colors.text.tertiary }}>{comment.date}</span>
                        </div>
                        <p className="text-sm" style={{ color: colors.text.secondary }}>{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-xl font-bold mb-6" style={{ color: colors.text.primary }}>Quick Actions</h3>
              <Card padding="md">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <span className="mr-2">📊</span> View Analytics
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <span className="mr-2">💰</span> View Earnings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <span className="mr-2">⚙️</span> Manage Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <span className="mr-2">❓</span> Get Support
                  </Button>
                </div>
              </Card>
            </div>
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
