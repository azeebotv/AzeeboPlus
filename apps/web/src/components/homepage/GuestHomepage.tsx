'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { usePWA } from '../../hooks/usePWA';
import { useSettings } from '@/hooks/useDatabase';
import AppHeader from '../layout/AppHeader';
import AppFooter from '../layout/AppFooter';
import { AmbientGlow } from '@/components/motion/AmbientGlow';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { api } from '@/lib/api';
import type { ContentItem } from '@/lib/api';
import ContentRow from './ContentRow';

type CategoryCard = {
  category: string;
  sub: string;
  descriptor: string;
  emoji: string;
  side: 'left' | 'right';
};

const CATEGORY_CARDS: CategoryCard[] = [
  {
    category: 'Reality',
    sub: 'Universe',
    descriptor: 'Reality TV & Shows',
    emoji: '\u{1F4FA}',
    side: 'left',
  },
  {
    category: 'Vertical',
    sub: 'Universe',
    descriptor: 'Short-Form Content',
    emoji: '\u{1F4F1}',
    side: 'left',
  },
  {
    category: 'Movie',
    sub: 'Universe',
    descriptor: 'Nollywood & Beyond',
    emoji: '\u{1F3AC}',
    side: 'left',
  },
  {
    category: 'Creator',
    sub: 'Universe',
    descriptor: 'Vlogs & Livestreams',
    emoji: '\u{1F4E1}',
    side: 'right',
  },
  {
    category: 'Cinemaxis',
    sub: 'Digital Cinema',
    descriptor: 'Premium Viewing',
    emoji: '\u{1F3A6}',
    side: 'right',
  },
  {
    category: 'Comedy',
    sub: 'Universe',
    descriptor: 'Laughs & Skits',
    emoji: '\u{1F602}',
    side: 'right',
  },
  {
    category: 'Sports',
    sub: 'Universe',
    descriptor: 'Live Matches & Highlights',
    emoji: '\u26BD',
    side: 'left',
  },
  {
    category: 'Lifestyle',
    sub: 'Universe',
    descriptor: 'Culture & Heritage',
    emoji: '\u{1F3A8}',
    side: 'left',
  },
  {
    category: 'Games',
    sub: 'Universe',
    descriptor: 'Play & Compete',
    emoji: '\u{1F3AE}',
    side: 'right',
  },
];

export default function GuestHomepage(): React.JSX.Element {
  const { t } = useTranslation();
  const { isOnline, isInstalled, install } = usePWA();
  const { getSetting } = useSettings();
  const siteName = getSetting('site_name', 'Azeebo+');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // Greeting cycle
  const greetings = ['Ekaabo.', 'Welcome.', 'Sannu Da Zuwa.'];
  const [greetingIndex, setGreetingIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % greetings.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [greetings.length]);

  useEffect((): (() => void) | undefined => {
    if (!isInstalled && 'serviceWorker' in navigator) {
      const timer = setTimeout(() => setShowInstallPrompt(true), 5000);
      return (): void => clearTimeout(timer);
    }
    return undefined;
  }, [isInstalled]);

  // Load trending content for guest preview
  useEffect(() => {
    const loadGuestContent = async () => {
      try {
        const trending = await api.content.getTrendingContent(12);
        if (trending.success && trending.data) {
          setTrendingContent(Array.isArray(trending.data) ? trending.data : []);
        }
      } catch {
        // Guest page gracefully degrades without content
      }
    };
    loadGuestContent();
  }, []);

  const handleInstall = async (): Promise<void> => {
    const accepted = await install();
    if (accepted) setShowInstallPrompt(false);
  };

  const leftCards = CATEGORY_CARDS.filter((c) => c.side === 'left');
  const rightCards = CATEGORY_CARDS.filter((c) => c.side === 'right');

  const renderOrbitCard = (c: CategoryCard, index: number): React.JSX.Element => (
    <motion.div
      key={c.category}
      className="az-glass flex items-center gap-3 px-3 py-3"
      style={{ width: 220 }}
      initial={{ opacity: 0, x: c.side === 'left' ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: 0.5 + index * 0.12,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
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
    </motion.div>
  );

  return (
    <div className="min-h-screen az-nollywood-bg">
      {/* Offline banner */}
      {!isOnline && (
        <motion.div
          className="text-center py-2 px-4 text-sm font-medium sticky top-0 z-50"
          style={{ background: '#fbbf24', color: '#000' }}
          initial={{ y: -40 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          You are offline. Some features may not be available.
        </motion.div>
      )}

      {/* Install prompt */}
      {showInstallPrompt && !isInstalled && (
        <motion.div
          className="az-glass fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 p-4 z-50"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-white">Install {siteName}</p>
              <p className="text-sm text-white/55 truncate">
                Get the app experience on your device
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowInstallPrompt(false)}
                className="px-4 py-1.5 rounded-full text-sm text-white/60 hover:text-white transition-colors"
              >
                Later
              </button>
              <motion.button
                type="button"
                onClick={handleInstall}
                className="az-btn-primary"
                style={{ width: 'auto', paddingInline: '1.25rem', fontSize: '0.8rem' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Install
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      <AppHeader active="Home" />

      {/* ===================== Hero ===================== */}
      <section
        ref={heroRef}
        className="relative w-full overflow-hidden flex items-center justify-center py-16 sm:py-20 lg:py-28"
        style={{ backgroundColor: 'var(--brand-forest)' }}
      >
        <AmbientGlow color="rgba(13,90,60,0.5)" size={600} className="-top-48 -left-48" />

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
        <motion.div
          className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-10 px-4 sm:px-6 text-center lg:text-left"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          {/* Phone mockup */}
          <motion.div
            className="relative rounded-[2.5rem] p-2 flex-shrink-0"
            style={{
              width: 220,
              height: 440,
              background: 'linear-gradient(160deg, #1A0A0A, #000)',
              border: '2px solid rgba(255,255,255,0.15)',
              boxShadow: '0 0 50px rgba(232,66,10,0.25), 0 30px 60px rgba(0,0,0,0.6)',
            }}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full"
              style={{ width: 86, height: 18, background: '#000' }}
            />
            <div
              className="relative w-full h-full rounded-[2.1rem] overflow-hidden flex flex-col items-center justify-center px-4 sm:px-5"
              style={{
                background:
                  'linear-gradient(160deg, rgba(204,28,28,0.35) 0%, rgba(13,59,46,0.6) 60%, rgba(26,10,10,0.9) 100%)',
              }}
            >
              <div className="grid grid-cols-3 gap-1.5 mb-4 sm:mb-5 opacity-90">
                {['\u{1F3AC}', '\u{1F3A4}', '\u26BD', '\u{1F3AD}', '\u{1F3C6}', '\u{1F3B5}'].map(
                  (e, i) => (
                    <motion.div
                      key={i}
                      className="rounded-md flex items-center justify-center text-base sm:text-lg"
                      style={{
                        width: 38,
                        height: 38,
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.12)',
                      }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.08, duration: 0.35 }}
                    >
                      {e}
                    </motion.div>
                  )
                )}
              </div>
              <p className="az-headline text-white text-lg sm:text-xl leading-tight mb-1">Ekaabo</p>
              <p className="text-white/80 text-xs sm:text-sm font-semibold mb-1">Sannu Da Zuwa</p>
              <p className="az-headline text-white text-base sm:text-lg leading-tight mb-4 sm:mb-5">
                {t('home.greeting')}
              </p>
              <Link href="/auth/register">
                <motion.button
                  type="button"
                  className="az-btn-primary"
                  style={{ width: 'auto', paddingInline: '1.5rem', fontSize: '0.75rem' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('auth.getStarted').toUpperCase()}
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Headline + CTA */}
          <div className="max-w-lg">
            <h1 className="az-headline text-white text-3xl sm:text-4xl lg:text-5xl xl:text-6xl mb-4">
              <AnimatePresence mode="wait">
                <motion.span
                  key={greetingIndex}
                  className="block"
                  style={{ color: 'var(--brand-orange)' }}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {greetings[greetingIndex]}
                </motion.span>
              </AnimatePresence>
            </h1>
            <motion.p
              className="text-white/70 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
            >
              {t('home.heroDescription')}
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5 }}
            >
              <Link href="/auth/register">
                <motion.button
                  type="button"
                  className="az-btn-primary"
                  style={{ width: 'auto', paddingInline: '2.5rem' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('auth.getStarted')}
                </motion.button>
              </Link>
              <Link href="/auth/login">
                <motion.button
                  type="button"
                  className="px-6 py-3 rounded-full text-sm font-semibold text-white hover:text-white/80 transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.25)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('auth.alreadyHaveAccount')}
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ===================== Main Content ===================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Trending Now — visible to guests as preview */}
        {trendingContent.length > 0 && (
          <ContentRow
            title={t('home.trending')}
            subtitle={t('home.trendingSubtitle')}
            sectionId="guest-trending"
            items={trendingContent}
            cardSize="lg"
          />
        )}

        {/* Rewards & Call to Action */}
        <ScrollReveal>
          <section
            className="relative py-10 sm:py-14 rounded-3xl overflow-hidden mt-8"
            style={{
              background: 'linear-gradient(135deg, #CC1C1C 0%, #E8420A 100%)',
              boxShadow: '0 20px 50px rgba(204,28,28,0.35)',
            }}
          >
            <AmbientGlow color="rgba(255,255,255,0.15)" size={400} className="-top-32 -right-24" />
            <div className="relative z-10 max-w-3xl mx-auto text-center px-4 sm:px-6">
              <motion.span
                className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
                style={{ background: 'rgba(255,255,255,0.18)', color: 'var(--brand-white)' }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                {t('home.earnWhileWatching')}
              </motion.span>
              <h3 className="az-headline text-white text-3xl sm:text-4xl lg:text-5xl mb-4">
                {t('home.unlockRewards')}
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-white/90 mb-6 sm:mb-8 max-w-xl mx-auto">
                {t('home.rewardsDescription', { siteName })}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link href="/auth/register">
                  <motion.button
                    type="button"
                    className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm sm:text-base font-bold transition-all"
                    style={{ background: 'var(--brand-near-black)', color: 'var(--brand-white)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t('home.startEarning')}
                  </motion.button>
                </Link>
                <Link href="/auth/login">
                  <motion.button
                    type="button"
                    className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm sm:text-base font-semibold text-white transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.4)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t('auth.login')}
                  </motion.button>
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Browse by Universe CTA */}
        <ScrollReveal>
          <section className="mt-12 sm:mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">
              {t('home.exploreByUniverse')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { name: 'Movie', icon: '\u{1F3AC}', href: '/movies', color: 'var(--brand-orange)' },
                { name: 'Comedy', icon: '\u{1F602}', href: '/comedy', color: '#fbbf24' },
                { name: 'Sports', icon: '\u26BD', href: '/sports', color: 'var(--color-success-500)' },
                { name: 'Reality', icon: '\u{1F4FA}', href: '/reality', color: '#8b5cf6' },
                { name: 'Lifestyle', icon: '\u{1F3A8}', href: '/lifestyle', color: '#ec4899' },
                { name: 'Vertical', icon: '\u{1F4F1}', href: '/vertical', color: '#3b82f6' },
                { name: 'Games', icon: '\u{1F3AE}', href: '/games', color: '#06b6d4' },
                { name: 'Creator', icon: '\u{1F4E1}', href: '/creators', color: '#f97316' },
                { name: 'Cinemaxis', icon: '\u{1F3A6}', href: '/cinemaxis', color: '#a855f7' },
              ].map((u) => (
                <Link
                  key={u.name}
                  href={u.href}
                  className="az-glass flex items-center gap-3 p-4 rounded-xl hover:scale-[1.03] transition-transform"
                >
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ background: `${u.color}22` }}
                  >
                    {u.icon}
                  </div>
                  <span className="font-semibold text-white text-sm">{u.name}</span>
                </Link>
              ))}
            </div>
          </section>
        </ScrollReveal>
      </main>

      <AppFooter siteName={siteName} />
    </div>
  );
}
