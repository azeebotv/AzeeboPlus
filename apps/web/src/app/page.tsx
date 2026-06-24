'use client';
import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { usePWA } from '../hooks/usePWA';
import Link from 'next/link';
import { useSettings } from '@/hooks/useDatabase';
import AppHeader from '../components/layout/AppHeader';
import AppFooter from '../components/layout/AppFooter';
import { AmbientGlow } from '@/components/motion/AmbientGlow';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { StaggerGrid } from '@/components/motion/StaggerGrid';

type CategoryCard = {
  category: string;
  sub: string;
  descriptor: string;
  emoji: string;
  side: 'left' | 'right';
};

const CATEGORY_CARDS: CategoryCard[] = [
  { category: 'Music', sub: 'Afrobeats', descriptor: 'Wande Coal', emoji: '\u{1F3A4}', side: 'left' },
  { category: 'Movies', sub: 'Nollywood', descriptor: 'Genevive Nnaji', emoji: '\u{1F3AC}', side: 'left' },
  { category: 'Sports', sub: 'Super Eagles', descriptor: 'Live Matches', emoji: '\u26BD', side: 'left' },
  { category: 'Culture', sub: 'Heritage', descriptor: 'Osun Osogbo', emoji: '\u{1FA95}', side: 'right' },
  { category: 'Comedy', sub: 'Taooma', descriptor: 'Laugh Out Loud', emoji: '\u{1F602}', side: 'right' },
  { category: 'Creators', sub: 'Vloggers', descriptor: 'Live Stream', emoji: '\u{1F4E1}', side: 'right' },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function Home(): React.JSX.Element {
  const { isOnline, isInstalled, install } = usePWA();
  const { getSetting } = useSettings();
  const siteName = getSetting('site_name', 'Azeebo+');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect((): (() => void) | undefined => {
    if (!isInstalled && 'serviceWorker' in navigator) {
      const timer = setTimeout(() => setShowInstallPrompt(true), 5000);
      return (): void => clearTimeout(timer);
    }
    return undefined;
  }, [isInstalled]);

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
              <p className="text-sm text-white/55 truncate">Get the app experience on your device</p>
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

      {/* ===================== Header ===================== */}
      <AppHeader active="Home" />

      {/* ===================== Hero (Splash/Welcome on forest green) ===================== */}
      <section
        ref={heroRef}
        className="relative w-full overflow-hidden flex items-center justify-center py-16 sm:py-20 lg:py-28"
        style={{ backgroundColor: '#0D3B2E' }}
      >
        {/* Ambient glow — drifts */}
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
                {['\u{1F3AC}', '\u{1F3A4}', '\u26BD', '\u{1F3AD}', '\u{1F3C6}', '\u{1F3B5}'].map((e, i) => (
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
                ))}
              </div>
              <p className="az-headline text-white text-lg sm:text-xl leading-tight mb-1">Ekaabo</p>
              <p className="text-white/80 text-xs sm:text-sm font-semibold mb-1">Sannu Da Zuwa</p>
              <p className="az-headline text-white text-base sm:text-lg leading-tight mb-4 sm:mb-5">Welcome Home</p>
              <Link href="/auth/register">
                <motion.button
                  type="button"
                  className="az-btn-primary"
                  style={{ width: 'auto', paddingInline: '1.5rem', fontSize: '0.75rem' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  GET STARTED
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Headline + CTA */}
          <div className="max-w-lg">
            <h1 className="az-headline text-white text-3xl sm:text-4xl lg:text-5xl xl:text-6xl mb-4">
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                Ekaabo.
              </motion.span>
              <motion.span
                className="block"
                style={{ color: '#E8420A' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                Welcome Home.
              </motion.span>
            </h1>
            <motion.p
              className="text-white/70 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
            >
              The home of Nigerian entertainment — Afrobeats, Nollywood, Super Eagles, comedy,
              creators and more. Stream, vote, earn, and celebrate culture.
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
                  Get Started Free
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
                  I already have an account
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ===================== Main Content ===================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Rewards & Call to Action */}
        <ScrollReveal>
          <section
            className="relative py-10 sm:py-14 rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #CC1C1C 0%, #E8420A 100%)',
              boxShadow: '0 20px 50px rgba(204,28,28,0.35)',
            }}
          >
            <AmbientGlow color="rgba(255,255,255,0.15)" size={400} className="-top-32 -right-24" />
            <div className="relative z-10 max-w-3xl mx-auto text-center px-4 sm:px-6">
              <motion.span
                className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
                style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                Earn While Watching
              </motion.span>
              <h3 className="az-headline text-white text-3xl sm:text-4xl lg:text-5xl mb-4">
                Unlock Exclusive Rewards
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-white/90 mb-6 sm:mb-8 max-w-xl mx-auto">
                Join {siteName} today and get rewarded for every show you watch, every vote you cast,
                and every share you make.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link href="/auth/register">
                  <motion.button
                    type="button"
                    className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm sm:text-base font-bold transition-all"
                    style={{ background: '#1A0A0A', color: '#fff' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Earning Now
                  </motion.button>
                </Link>
                <motion.button
                  type="button"
                  className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm sm:text-base font-semibold text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.4)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Explore Rewards
                </motion.button>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </main>

      {/* ===================== Footer ===================== */}
      <AppFooter siteName={siteName} />
    </div>
  );
}
