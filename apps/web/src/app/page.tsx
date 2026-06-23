'use client';
import React from 'react';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePWA } from '../hooks/usePWA';
import { api, ContentItem } from '../lib/api';
import { Skeleton } from '@azeebo/ui';
import Link from 'next/link';
import { ThemeToggle } from '../components/ThemeToggle';
import { useSettings } from '@/hooks/useDatabase';
import BrandLogo from '@/components/auth/BrandLogo';

type CategoryCard = {
  category: string;
  sub: string;
  descriptor: string;
  emoji: string;
  side: 'left' | 'right';
};

const CATEGORY_CARDS: CategoryCard[] = [
  { category: 'Music', sub: 'Afrobeats', descriptor: 'Wande Coal', emoji: '🎤', side: 'left' },
  { category: 'Movies', sub: 'Nollywood', descriptor: 'Jenevive Nnaji', emoji: '🎬', side: 'left' },
  {
    category: 'Sports',
    sub: 'Super Eagles',
    descriptor: 'Live Matches',
    emoji: '⚽',
    side: 'left',
  },
  { category: 'Culture', sub: 'Heritage', descriptor: 'Osun Osogbo', emoji: '🪕', side: 'right' },
  { category: 'Comedy', sub: 'Taooma', descriptor: 'Laugh Out Loud', emoji: '😂', side: 'right' },
  { category: 'Creators', sub: 'Vloggers', descriptor: 'Live Stream', emoji: '📡', side: 'right' },
];

export default function Home(): React.JSX.Element {
  const { user, isAuthenticated, logout } = useAuth();
  const { isOnline, isInstalled, install } = usePWA();
  const { getSetting } = useSettings();
  const siteName = getSetting('site_name', 'Azeebo+');
  const [featuredContent, setFeaturedContent] = useState<ContentItem[]>([]);
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect((): void => {
    const fetchContent = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const [featuredRes, trendingRes] = await Promise.all([
          api.content.getFeaturedContent(3),
          api.content.getTrendingContent(8),
        ]);

        const toContentArray = (val: unknown): ContentItem[] => {
          if (Array.isArray(val)) return val as ContentItem[];
          if (val && typeof val === 'object' && Array.isArray((val as Record<string, unknown>).data)) {
            return (val as Record<string, unknown>).data as ContentItem[];
          }
          return [];
        };

        if (featuredRes.success) {
          setFeaturedContent(toContentArray(featuredRes.data));
        }

        if (trendingRes.success) {
          setTrendingContent(toContentArray(trendingRes.data));
        }
      } catch {
        // Error handling is intentionally minimal - content will show as empty
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  useEffect((): (() => void) | undefined => {
    if (!isInstalled && 'serviceWorker' in navigator) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000);
      return (): void => clearTimeout(timer);
    }
    return undefined;
  }, [isInstalled]);

  const handleInstall = async (): Promise<void> => {
    const accepted = await install();
    if (accepted) {
      setShowInstallPrompt(false);
    }
  };

  const leftCards = CATEGORY_CARDS.filter((c) => c.side === 'left');
  const rightCards = CATEGORY_CARDS.filter((c) => c.side === 'right');

  const renderOrbitCard = (c: CategoryCard, index: number): React.JSX.Element => (
    <div
      key={c.category}
      className="az-glass flex items-center gap-3 px-3 py-3"
      style={{
        width: 220,
        opacity: 0,
        animation: `fadeIn 0.6s ease ${0.2 + index * 0.12}s forwards`,
      }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-lg"
        style={{
          width: 44,
          height: 44,
          background: 'linear-gradient(135deg, #E8420A, #CC1C1C)',
          fontSize: 22,
        }}
      >
        {c.emoji}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-white text-sm leading-tight">
          {c.category} <span className="text-white/60">/ {c.sub}</span>
        </p>
        <p className="text-white/50 italic text-xs leading-tight mt-0.5">{c.descriptor}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      {/* Offline banner */}
      {!isOnline && (
        <div
          className="text-center py-2 px-4 text-sm font-medium sticky top-0 z-50"
          style={{ background: '#fbbf24', color: '#000' }}
        >
          ⚠️ You are offline. Some features may not be available.
        </div>
      )}

      {/* Install prompt */}
      {showInstallPrompt && !isInstalled && (
        <div className="az-glass fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 p-4 z-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Install {siteName}</p>
              <p className="text-sm text-white/55">Get the app experience on your device</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowInstallPrompt(false)}
                className="px-4 py-1.5 rounded-full text-sm text-white/60 hover:text-white transition-colors"
              >
                Later
              </button>
              <button
                type="button"
                onClick={handleInstall}
                className="az-btn-primary"
                style={{ width: 'auto', paddingInline: '1.25rem', fontSize: '0.8rem' }}
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== Header ===================== */}
      <header
        className="sticky top-0 z-40"
        style={{
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          background: 'rgba(13,59,46,0.7)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <BrandLogo variant="orange" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Browse', 'Library', 'Creators'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                className="text-base font-medium text-white/70 hover:text-white transition-colors"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-full flex items-center justify-center font-bold text-white"
                    style={{
                      width: 36,
                      height: 36,
                      background: 'linear-gradient(135deg, #E8420A, #CC1C1C)',
                    }}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium text-white hidden sm:block">
                    {user?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="px-4 py-1.5 rounded-full text-sm font-medium text-white/70 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <button
                    type="button"
                    className="px-4 py-1.5 rounded-full text-sm font-medium text-white/80 hover:text-white transition-colors"
                  >
                    Sign In
                  </button>
                </Link>
                <Link href="/auth/register">
                  <button
                    type="button"
                    className="az-btn-primary"
                    style={{ width: 'auto', paddingInline: '1.25rem', fontSize: '0.8rem' }}
                  >
                    Get Started
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===================== Hero (Splash/Welcome on forest green) ===================== */}
      <section
        className="relative w-full overflow-hidden flex items-center justify-center py-20 lg:py-28"
        style={{ backgroundColor: '#0D3B2E' }}
      >
        {/* Ambient green glow */}
        <div
          className="az-ambient-red"
          style={{
            width: 600,
            height: 600,
            top: -200,
            left: -200,
            background: 'radial-gradient(circle, rgba(13,90,60,0.6) 0%, transparent 70%)',
          }}
        />

        {/* Orbiting category cards (desktop only) */}
        <div className="hidden xl:flex absolute inset-0 items-center pointer-events-none">
          <div className="flex flex-col gap-6 mr-auto pl-8 2xl:pl-24">
            {leftCards.map(renderOrbitCard)}
          </div>
          <div className="flex flex-col gap-6 ml-auto pr-8 2xl:pr-24">
            {rightCards.map(renderOrbitCard)}
          </div>
        </div>

        {/* Center: phone mockup + multilingual welcome */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 px-6 text-center lg:text-left">
          {/* Phone mockup */}
          <div
            className="relative rounded-[2.5rem] p-2"
            style={{
              width: 240,
              height: 480,
              background: 'linear-gradient(160deg, #1A0A0A, #000)',
              border: '2px solid rgba(255,255,255,0.15)',
              boxShadow: '0 0 50px rgba(232,66,10,0.25), 0 30px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full"
              style={{ width: 86, height: 18, background: '#000' }}
            />
            <div
              className="relative w-full h-full rounded-[2.1rem] overflow-hidden flex flex-col items-center justify-center px-5"
              style={{
                background:
                  'linear-gradient(160deg, rgba(204,28,28,0.35) 0%, rgba(13,59,46,0.6) 60%, rgba(26,10,10,0.9) 100%)',
              }}
            >
              <div className="grid grid-cols-3 gap-1.5 mb-5 opacity-90">
                {['🎬', '🎤', '⚽', '🎭', '🏆', '🎵'].map((e, i) => (
                  <div
                    key={i}
                    className="rounded-md flex items-center justify-center text-lg"
                    style={{
                      width: 42,
                      height: 42,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {e}
                  </div>
                ))}
              </div>
              <p className="az-headline text-white text-xl leading-tight mb-1">Ekaabo</p>
              <p className="text-white/80 text-sm font-semibold mb-1">Sannu Da Zuwa</p>
              <p className="az-headline text-white text-lg leading-tight mb-5">Welcome Home</p>
              <Link href="/auth/register">
                <button
                  type="button"
                  className="az-btn-primary"
                  style={{ width: 'auto', paddingInline: '1.5rem', fontSize: '0.75rem' }}
                >
                  GET STARTED
                </button>
              </Link>
            </div>
          </div>

          {/* Headline + CTA */}
          <div className="max-w-lg">
            <h1 className="az-headline text-white text-4xl sm:text-5xl lg:text-6xl mb-4">
              <span className="block">Ekaabo.</span>
              <span className="block" style={{ color: '#E8420A' }}>
                Welcome Home.
              </span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg mb-8 leading-relaxed">
              The home of Nigerian entertainment — Afrobeats, Nollywood, Super Eagles, comedy,
              creators and more. Stream, vote, earn, and celebrate culture.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link href="/auth/register">
                <button
                  type="button"
                  className="az-btn-primary"
                  style={{ width: 'auto', paddingInline: '2.5rem' }}
                >
                  Get Started Free
                </button>
              </Link>
              <Link href="/auth/login">
                <button
                  type="button"
                  className="px-6 py-3 rounded-full text-sm font-semibold text-white hover:text-white/80 transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.25)' }}
                >
                  I already have an account
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Main Content ===================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Featured Content */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: '#E8420A' }}
              >
                Handpicked for you
              </p>
              <h2 className="az-headline text-white text-3xl sm:text-4xl">Featured Content</h2>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.15)' }}
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="az-glass overflow-hidden">
                    <Skeleton height="200px" borderRadius="0px" />
                    <div className="p-5 space-y-3">
                      <Skeleton width="80%" height="20px" />
                      <Skeleton width="60%" height="16px" />
                    </div>
                  </div>
                ))
              : (Array.isArray(featuredContent) ? featuredContent : []).map((content) => (
                  <div key={content.id} className="az-glass overflow-hidden group cursor-pointer">
                    <div
                      className="relative h-48 flex items-center justify-center"
                      style={{
                        background: content.thumbnail
                          ? `url(${content.thumbnail})`
                          : 'linear-gradient(135deg, rgba(232,66,10,0.3), rgba(13,59,46,0.4))',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {!content.thumbnail && (
                        <span style={{ fontSize: 48 }}>{content.universe?.icon || '🎬'}</span>
                      )}
                      <span
                        className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded"
                        style={{ background: '#CC1C1C', color: '#fff' }}
                      >
                        Premium
                      </span>
                    </div>
                    <div className="p-5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1">
                        {content.universe?.name}
                      </p>
                      <h3 className="font-bold text-white text-base mb-1 group-hover:text-[#E8420A] transition-colors">
                        {content.title}
                      </h3>
                      <p className="text-white/50 text-sm line-clamp-2">{content.description}</p>
                    </div>
                  </div>
                ))}
          </div>
        </section>

        {/* Divider */}
        <div className="az-divider">Trending</div>

        {/* Trending Now */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: '#E8420A' }}
              >
                What everyone is watching
              </p>
              <h2 className="az-headline text-white text-3xl sm:text-4xl">Trending Now</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="az-glass overflow-hidden">
                    <Skeleton height="140px" borderRadius="0px" />
                    <div className="p-4 space-y-2">
                      <Skeleton width="75%" height="18px" />
                    </div>
                  </div>
                ))
              : (Array.isArray(trendingContent) ? trendingContent : []).map((content) => (
                  <div key={content.id} className="az-glass overflow-hidden group cursor-pointer">
                    <div
                      className="relative h-36 flex items-center justify-center"
                      style={{
                        background: content.thumbnail
                          ? `url(${content.thumbnail})`
                          : 'linear-gradient(135deg, rgba(204,28,28,0.3), rgba(26,10,10,0.5))',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {!content.thumbnail && (
                        <span style={{ fontSize: 36 }}>{content.universe?.icon || '🔥'}</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white text-sm group-hover:text-[#E8420A] transition-colors line-clamp-1">
                        {content.title}
                      </h3>
                    </div>
                  </div>
                ))}
          </div>
        </section>

        {/* Rewards & Call to Action */}
        <section
          className="relative py-14 rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #CC1C1C 0%, #E8420A 100%)',
            boxShadow: '0 20px 50px rgba(204,28,28,0.35)',
          }}
        >
          <div
            className="az-ambient-red"
            style={{ width: 400, height: 400, top: -150, right: -100, opacity: 0.6 }}
          />
          <div className="relative z-10 max-w-3xl mx-auto text-center px-6">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
            >
              🔥 Earn While Watching
            </span>
            <h3 className="az-headline text-white text-4xl sm:text-5xl mb-4">
              Unlock Exclusive Rewards
            </h3>
            <p className="text-lg text-white/90 mb-8 max-w-xl mx-auto">
              Join {siteName} today and get rewarded for every show you watch, every vote you cast,
              and every share you make.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <button
                  type="button"
                  className="px-8 py-3.5 rounded-full text-base font-bold transition-all hover:scale-105"
                  style={{ background: '#1A0A0A', color: '#fff' }}
                >
                  Start Earning Now
                </button>
              </Link>
              <button
                type="button"
                className="px-8 py-3.5 rounded-full text-base font-semibold text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.4)' }}
              >
                Explore Rewards
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ===================== Footer ===================== */}
      <footer
        className="border-t py-12"
        style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#0d0505' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            <div className="md:col-span-2">
              <BrandLogo variant="orange" />
              <p className="text-white/50 text-sm mt-4 max-w-xs leading-relaxed">
                The home of Nigerian entertainment. Stream, vote, earn, and celebrate culture.
              </p>
            </div>
            {[
              { heading: siteName, items: ['About', 'Careers', 'Press'] },
              { heading: 'Help', items: ['Support', 'FAQ', 'Contact'] },
              { heading: 'Legal', items: ['Terms', 'Privacy', 'Cookies'] },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="font-bold text-white text-sm mb-4">{col.heading}</h4>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-white/50 hover:text-[#E8420A] transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            className="mt-12 pt-8 border-t text-center text-sm text-white/40"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <p>© 2026 {siteName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
