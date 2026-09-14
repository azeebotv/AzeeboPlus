'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { usePWA } from '../../hooks/usePWA';
import { useSettings } from '@/hooks/useDatabase';
import AppHeader from '../layout/AppHeader';
import AppFooter from '../layout/AppFooter';
import { AmbientGlow } from '@/components/motion/AmbientGlow';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

/* ─── Types ─── */
type PosterItem = {
  id: string;
  title: string;
  genre: string;
  rating: string;
  image: string;
};

type MiniPoster = {
  title: string;
  image: string;
};

type UniverseCategory = {
  name: string;
  slug: string;
  miniPosters: MiniPoster[];
};

type GalleryItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  badge: string;
};

type FaqItem = {
  id: string;
  num: string;
  question: string;
  answer: string;
};

/* ─── 8x3 Hero Wall: 24 Real African Cinema & Nollywood Posters ─── */
const HERO_POSTERS_24: PosterItem[] = [
  {
    id: 'p1',
    title: 'The Ember Queen',
    genre: 'Historical Epic',
    rating: '4.9',
    image: '/images/poster_ember_queen.jpg',
  },
  {
    id: 'p2',
    title: 'Neo Lagos 2099',
    genre: 'Afro-Cyberpunk',
    rating: '4.8',
    image: '/images/poster_neo_lagos.jpg',
  },
  {
    id: 'p3',
    title: 'King of Boys: Return',
    genre: 'Political Crime',
    rating: '5.0',
    image: '/images/posters/poster_01.jpg',
  },
  {
    id: 'p4',
    title: 'Shanty Town Saga',
    genre: 'Underworld Thriller',
    rating: '4.7',
    image: '/images/posters/poster_02.jpg',
  },
  {
    id: 'p5',
    title: 'Blood & Water Legacy',
    genre: 'Mystery Drama',
    rating: '4.8',
    image: '/images/posters/poster_03.jpg',
  },
  {
    id: 'p6',
    title: 'Jagun Jagun: Awakening',
    genre: 'Yoruba Epic',
    rating: '4.9',
    image: '/images/posters/poster_04.jpg',
  },
  {
    id: 'p7',
    title: 'Lekki Wives: Uncut',
    genre: 'High Society',
    rating: '4.6',
    image: '/images/posters/poster_05.jpg',
  },
  {
    id: 'p8',
    title: 'Aníkúlápó: Mystic',
    genre: 'Dark Fantasy',
    rating: '4.9',
    image: '/images/posters/poster_06.jpg',
  },
  {
    id: 'p9',
    title: 'The Black Book',
    genre: 'Revenge Thriller',
    rating: '4.8',
    image: '/images/posters/poster_07.jpg',
  },
  {
    id: 'p10',
    title: 'Brotherhood: Final Stand',
    genre: 'Heist Action',
    rating: '4.7',
    image: '/images/posters/poster_08.jpg',
  },
  {
    id: 'p11',
    title: 'Far From Home',
    genre: 'Teen Drama',
    rating: '4.7',
    image: '/images/posters/poster_09.jpg',
  },
  {
    id: 'p12',
    title: 'Abuja Hustlers Club',
    genre: 'Satirical Comedy',
    rating: '4.6',
    image: '/images/posters/poster_10.jpg',
  },
  {
    id: 'p13',
    title: 'Sisi Eko Nights',
    genre: 'Urban Romance',
    rating: '4.8',
    image: '/images/posters/poster_11.jpg',
  },
  {
    id: 'p14',
    title: 'Gangs of Lagos',
    genre: 'Gritty Action',
    rating: '4.9',
    image: '/images/posters/poster_12.jpg',
  },
  {
    id: 'p15',
    title: 'Bling Lagosians: All Stars',
    genre: 'Drama Comedy',
    rating: '4.7',
    image: '/images/posters/poster_13.jpg',
  },
  {
    id: 'p16',
    title: 'Oloture: The Run',
    genre: 'Investigative',
    rating: '4.8',
    image: '/images/posters/poster_14.jpg',
  },
  {
    id: 'p17',
    title: 'Lionheart: Dynasty',
    genre: 'Business Drama',
    rating: '4.7',
    image: '/images/posters/poster_15.jpg',
  },
  {
    id: 'p18',
    title: 'Glamour Girls: Midnight',
    genre: 'Glamour Noir',
    rating: '4.5',
    image: '/images/posters/poster_16.jpg',
  },
  {
    id: 'p19',
    title: 'Citation: Justice',
    genre: 'Legal Drama',
    rating: '4.9',
    image: '/images/posters/poster_17.jpg',
  },
  {
    id: 'p20',
    title: 'Ijakumo: Born Again',
    genre: 'Spiritual Thriller',
    rating: '4.6',
    image: '/images/posters/poster_18.jpg',
  },
  {
    id: 'p21',
    title: 'Sugar Rush: Heist',
    genre: 'Action Comedy',
    rating: '4.7',
    image: '/images/posters/poster_19.jpg',
  },
  {
    id: 'p22',
    title: 'Chief Daddy: The Will',
    genre: 'Family Comedy',
    rating: '4.6',
    image: '/images/posters/poster_20.jpg',
  },
  {
    id: 'p23',
    title: 'Wedding Party: Forever',
    genre: 'Romance Comedy',
    rating: '4.8',
    image: '/images/posters/poster_21.jpg',
  },
  {
    id: 'p24',
    title: 'The Trade: Kingpins',
    genre: 'Cartel Crime',
    rating: '4.9',
    image: '/images/posters/poster_22.jpg',
  },
];

type DeviceFeature = {
  iconType: 'tv' | 'tablet' | 'phone' | 'laptop' | 'gamepad' | 'vr';
  title: string;
  desc: string;
};

/* ─── Device Features (3x2 Grid) ─── */
const DEVICE_FEATURES: DeviceFeature[] = [
  {
    iconType: 'tv',
    title: 'Smart TV',
    desc: 'Enjoy high-definition viewing on your big screen with full 4K UHD support.',
  },
  {
    iconType: 'tablet',
    title: 'Tablet',
    desc: 'Stream on the go with responsive touch controls and offline downloads.',
  },
  {
    iconType: 'phone',
    title: 'Smartphone',
    desc: 'Carry your universe everywhere. Optimized for portrait and landscape.',
  },
  {
    iconType: 'laptop',
    title: 'Laptops',
    desc: 'Full desktop streaming experience with theater mode and keyboard shortcuts.',
  },
  {
    iconType: 'gamepad',
    title: 'Gaming Consoles',
    desc: 'Stream right from your PlayStation, Xbox, or compatible console.',
  },
  {
    iconType: 'vr',
    title: 'VR Headsets',
    desc: 'Immersive 360° entertainment and virtual cinema experience.',
  },
];

function DeviceFlatIcon({
  type,
  className = 'w-6 h-6',
}: {
  type: DeviceFeature['iconType'];
  className?: string;
}) {
  switch (type) {
    case 'tv':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M17 2l-5 5-5-5" />
        </svg>
      );
    case 'tablet':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    case 'phone':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    case 'laptop':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M2 20h20" />
        </svg>
      );
    case 'gamepad':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="6" y1="12" x2="10" y2="12" />
          <line x1="8" y1="10" x2="8" y2="14" />
          <line x1="15" y1="13" x2="15.01" y2="13" />
          <line x1="18" y1="11" x2="18.01" y2="11" />
          <rect x="2" y="6" width="20" height="12" rx="4" />
        </svg>
      );
    case 'vr':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6a4 4 0 0 1-4 4h-1.5a2 2 0 0 1-1.6-.8l-1.3-1.7a1 1 0 0 0-1.2 0l-1.3 1.7a2 2 0 0 1-1.6.8H7a4 4 0 0 1-4-4V8z" />
          <circle cx="8" cy="11" r="1.5" />
          <circle cx="16" cy="11" r="1.5" />
        </svg>
      );
  }
}

/* ─── 5 Azeebo+ Universes (20 Real Image Mini Posters) ─── */
const UNIVERSE_CATEGORIES: UniverseCategory[] = [
  {
    name: 'Reality Universe',
    slug: '/reality',
    miniPosters: [
      { title: 'Big Brother', image: '/images/posters/poster_29.jpg' },
      { title: 'All Stars', image: '/images/posters/poster_30.jpg' },
      { title: 'Dating Naija', image: '/images/posters/poster_31.jpg' },
      { title: 'The Penthouse', image: '/images/posters/poster_32.jpg' },
    ],
  },
  {
    name: 'Movie Universe',
    slug: '/movies',
    miniPosters: [
      { title: 'The Ember Queen', image: '/images/poster_ember_queen.jpg' },
      { title: 'Neo Lagos 2099', image: '/images/poster_neo_lagos.jpg' },
      { title: 'King of Boys', image: '/images/posters/poster_01.jpg' },
      { title: 'Shanty Town', image: '/images/posters/poster_02.jpg' },
    ],
  },
  {
    name: 'Comedy Universe',
    slug: '/comedy',
    miniPosters: [
      { title: 'Basketmouth Live', image: '/images/posters/poster_21.jpg' },
      { title: 'Skit Makers NG', image: '/images/posters/poster_22.jpg' },
      { title: 'Laughter Therapy', image: '/images/posters/poster_23.jpg' },
      { title: 'Stand Up Special', image: '/images/posters/poster_24.jpg' },
    ],
  },
  {
    name: 'Sports Universe',
    slug: '/sports',
    miniPosters: [
      { title: 'Super Eagles', image: '/images/posters/poster_18.jpg' },
      { title: 'African Fight League', image: '/images/posters/poster_17.jpg' },
      { title: 'Premier Highlights', image: '/images/posters/poster_20.jpg' },
      { title: 'Afrobasket 2026', image: '/images/posters/poster_19.jpg' },
    ],
  },
  {
    name: 'Creator Universe',
    slug: '/creators',
    miniPosters: [
      { title: 'Afrobeats Sessions', image: '/images/posters/poster_25.jpg' },
      { title: 'Lagos Vlogger', image: '/images/posters/poster_26.jpg' },
      { title: 'Tech Pulse Africa', image: '/images/posters/poster_27.jpg' },
      { title: 'Cooking With Chef', image: '/images/posters/poster_28.jpg' },
    ],
  },
];

/* ─── Gallery Mosaic (8 Real Images) ─── */
const GALLERY_MOSAIC_ITEMS: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Deep Cosmos',
    subtitle: 'Sci-Fi Universe',
    image: '/images/posters/poster_13.jpg',
    badge: 'POPULAR',
  },
  {
    id: 'g2',
    title: 'Neo Lagos 2099',
    subtitle: 'Cyberpunk Nollywood',
    image: '/images/poster_neo_lagos.jpg',
    badge: 'TRENDING',
  },
  {
    id: 'g3',
    title: 'The Monolith',
    subtitle: 'Art & Culture',
    image: '/images/brand_hero.jpg',
    badge: 'EXCLUSIVE',
  },
  {
    id: 'g4',
    title: 'Cybernetic Eko',
    subtitle: 'Animation',
    image: '/images/posters/poster_33.jpg',
    badge: 'NEW',
  },
  {
    id: 'g5',
    title: 'Survival Game',
    subtitle: 'High-Stakes Reality',
    image: '/images/posters/poster_34.jpg',
    badge: 'TOP SHOW',
  },
  {
    id: 'g6',
    title: 'Neon Velocity',
    subtitle: 'Retro Street Racing',
    image: '/images/posters/poster_12.jpg',
    badge: 'ACTION',
  },
  {
    id: 'g7',
    title: 'The Ember Queen',
    subtitle: 'Historical Epic',
    image: '/images/poster_ember_queen.jpg',
    badge: 'ORIGINAL',
  },
  {
    id: 'g8',
    title: 'Golden Phoenix',
    subtitle: 'Afro-Mythology',
    image: '/images/posters/poster_14.jpg',
    badge: 'MUST WATCH',
  },
];

/* ─── 8 FAQ Items (2 columns x 4 rows) ─── */
const FAQ_ITEMS_8: FaqItem[] = [
  {
    id: 'faq-1',
    num: '01',
    question: 'What is Azeebo+?',
    answer:
      'Azeebo+ is a premier African and global streaming platform combining cinema, reality TV voting, creator content, live concerts, and a rewards economy all in one seamless experience.',
  },
  {
    id: 'faq-2',
    num: '02',
    question: 'How much does Azeebo+ cost?',
    answer:
      'Azeebo+ offers free ad-supported viewing and premium tiers starting at ₦1,800/month (or $3.99/mo USD) with full 4K UHD, zero ads, and offline downloads.',
  },
  {
    id: 'faq-3',
    num: '03',
    question: 'What content is available on Azeebo+?',
    answer:
      'Thousands of Nollywood blockbusters, Hollywood hits, African reality TV, live sporting matches, comedy specials, music festivals, and creator livestreams.',
  },
  {
    id: 'faq-4',
    num: '04',
    question: 'How do I cancel my subscription?',
    answer:
      'You can cancel anytime in your Account Settings under Subscription with a single click. You will retain access until the end of your billing cycle.',
  },
  {
    id: 'faq-5',
    num: '05',
    question: 'Where can I watch Azeebo+?',
    answer:
      'Anywhere, anytime! We support iOS, Android, Smart TVs (Samsung, LG, Sony), Chromecast, Amazon Fire TV, and modern desktop web browsers.',
  },
  {
    id: 'faq-6',
    num: '06',
    question: 'Can I download content to watch offline?',
    answer:
      'Yes, with our mobile and tablet apps on iOS and Android, Premium subscribers can download up to 25 titles for offline travel and commute viewing.',
  },
  {
    id: 'faq-7',
    num: '07',
    question: 'How does the free trial work?',
    answer:
      'New members get 7 days of full Premium access with zero commitment. You can explore all 9 Universes before your first monthly charge.',
  },
  {
    id: 'faq-8',
    num: '08',
    question: 'What devices are compatible?',
    answer:
      'Azeebo+ works seamlessly across Apple iPhone & iPad, Android phones & tablets, Apple TV, Android TV, gaming consoles, and all major web browsers.',
  },
];

export default function GuestHomepage(): React.JSX.Element {
  useTranslation();
  const { isOnline, isInstalled, install } = usePWA();
  const { getSetting } = useSettings();
  const siteName = getSetting('site_name', 'Azeebo+');

  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [openFaq, setOpenFaq] = useState<string>('faq-1'); // 01 is open by default as in design!
  const [emailValue, setEmailValue] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  useEffect((): (() => void) | undefined => {
    if (!isInstalled && 'serviceWorker' in navigator) {
      const timer = setTimeout(() => setShowInstallPrompt(true), 6000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isInstalled]);

  const handleInstall = async (): Promise<void> => {
    const accepted = await install();
    if (accepted) setShowInstallPrompt(false);
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    setEmailSubmitted(true);
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: 'var(--hp-bg)', color: 'var(--text-primary)' }}
    >
      {/* ── Offline Banner ── */}
      {!isOnline && (
        <motion.div
          role="alert"
          className="text-center py-2 px-4 text-sm font-medium sticky top-0 z-50"
          style={{ background: 'var(--hp-offline-bg)', color: 'var(--hp-offline-text)' }}
          initial={{ y: -40 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          You are offline. Some features may not be available.
        </motion.div>
      )}

      {/* ── PWA Install Toast ── */}
      <AnimatePresence>
        {showInstallPrompt && !isInstalled && (
          <motion.div
            className="az-glass fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 p-4 z-50 rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={`Install ${siteName}`}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-white">Install {siteName}</p>
                <p className="text-sm truncate text-white/60">
                  Stream your universe with offline mode
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowInstallPrompt(false)}
                  className="px-3 py-1.5 rounded-full text-xs text-white/60 hover:text-white transition-colors"
                >
                  Later
                </button>
                <button
                  type="button"
                  onClick={handleInstall}
                  className="az-btn-primary px-4 py-1.5 rounded-full text-xs font-semibold"
                >
                  Install
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AppHeader active="Home" logoVariant="light" />

      {/* ═══════════════════════════════════════════════════════════
          §1 HERO: "One Platform. Endless Universes." + 8x3 Posters
          ═══════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative w-full overflow-hidden pt-12 sm:pt-20 pb-16"
        style={{
          background:
            'radial-gradient(ellipse at 50% 20%, rgba(243, 80, 26, 0.15) 0%, rgba(11, 9, 14, 0.98) 75%)',
        }}
        aria-label="Hero: One Platform. Endless Universes."
      >
        <AmbientGlow
          color="rgba(232, 66, 10, 0.22)"
          size={650}
          className="-top-32 left-1/2 -translate-x-1/2"
        />

        <motion.div
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-5"
          style={{ y: heroY }}
        >
          {/* Centered Main Headline */}
          <h1
            className="az-headline font-extrabold tracking-tight"
            style={{
              color: 'var(--brand-white)',
              fontSize: 'clamp(2.25rem, 5.5vw, 4.25rem)',
              lineHeight: 1.12,
            }}
          >
            One Platform. Endless Universes.
          </h1>

          {/* Subtitle */}
          <p
            className="max-w-2xl text-sm sm:text-base leading-relaxed"
            style={{ color: 'rgba(255, 255, 255, 0.65)' }}
          >
            Stream Nollywood, reality shows, live events and creator content all in one place.
            Discover stories that inspire, entertain, and connect.
          </p>

          {/* Start Watching Pill Button */}
          <div className="pt-2">
            <Link href="/auth/register" tabIndex={-1}>
              <motion.button
                type="button"
                className="az-btn-primary az-ripple flex items-center gap-2"
                style={{
                  paddingInline: '2.5rem',
                  paddingBlock: '0.85rem',
                  fontSize: '0.95rem',
                  borderRadius: '9999px',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                aria-label="Start Watching"
              >
                <span>Start Watching</span>
                <span aria-hidden="true">▶</span>
              </motion.button>
            </Link>
          </div>

          {/* 8x3 Poster Wall Grid (24 Real Images) — scaled sleekly */}
          <div className="w-full max-w-5xl mx-auto mt-6 relative">
            <div
              className="grid gap-1.5 sm:gap-2"
              style={{
                gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
              }}
              role="img"
              aria-label="Grid of 24 trending movies, shows and universes"
            >
              {HERO_POSTERS_24.map((poster) => (
                <div
                  key={poster.id}
                  className="relative rounded-lg overflow-hidden group transition-transform duration-300 hover:scale-105 hover:z-20 cursor-pointer"
                  style={{
                    aspectRatio: '2 / 3',
                    background: 'var(--hp-card-bg)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.6)',
                  }}
                  title={poster.title}
                >
                  <Image
                    src={poster.image}
                    alt={poster.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 25vw, (max-width: 1024px) 14vw, 12vw"
                  />

                  {/* Top rating badge */}
                  <div className="absolute top-1.5 right-1.5 z-10">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                      style={{ background: 'rgba(0, 0, 0, 0.75)', color: '#fbbf24' }}
                    >
                      <svg
                        className="w-2.5 h-2.5 fill-current"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      {poster.rating}
                    </span>
                  </div>

                  {/* Subtle bottom info bar */}
                  <div
                    className="absolute inset-x-0 bottom-0 p-1.5 z-10 flex flex-col justify-end"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 80%)',
                    }}
                  >
                    <p className="text-[10px] font-bold text-white leading-tight truncate">
                      {poster.title}
                    </p>
                    <p className="text-[8px] text-white/60 leading-none truncate mt-0.5">
                      {poster.genre}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Seamless gradient fade out into the next section */}
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{
                height: '160px',
                background: 'linear-gradient(to bottom, rgba(11, 9, 14, 0) 0%, var(--hp-bg) 100%)',
              }}
              aria-hidden="true"
            />
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          §2 WE PROVIDE YOU STREAMING EXPERIENCE ACROSS VARIOUS DEVICES.
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto"
        aria-label="Device streaming compatibility"
      >
        <ScrollReveal direction="up">
          {/* Top 2-column header */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6 lg:gap-16 mb-12">
            <div className="lg:w-7/12">
              <span
                className="text-xs font-bold uppercase tracking-widest block mb-3"
                style={{ color: 'var(--brand-orange)' }}
              >
                DEVICE STREAMING
              </span>
              <h2
                className="az-headline font-extrabold uppercase leading-tight"
                style={{
                  color: 'var(--brand-white)',
                  fontSize: 'clamp(1.75rem, 3.8vw, 2.75rem)',
                }}
              >
                WE PROVIDE YOU STREAMING EXPERIENCE ACROSS VARIOUS DEVICES.
              </h2>
            </div>
            <div className="lg:w-5/12 pt-2">
              <p
                className="text-sm sm:text-base leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                With Azeebo+, you can enjoy your favorite shows, movies, and live events seamlessly
                across all your devices. Whether on your phone, tablet, smart TV, or desktop,
                we&apos;ve got you covered with synchronized progress.
              </p>
            </div>
          </div>

          {/* 3x2 Grid of 6 Device Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {DEVICE_FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="p-6 rounded-2xl flex flex-col justify-between transition-all duration-200"
                style={{
                  background: 'var(--hp-devices-card-bg)',
                  border: '1px solid var(--hp-devices-card-border)',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ translateY: -3, borderColor: 'rgba(243, 80, 26, 0.3)' }}
              >
                <div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-[var(--brand-orange)]"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(229, 37, 28, 0.15) 0%, rgba(255, 107, 0, 0.15) 100%)',
                      border: '1px solid rgba(243, 80, 26, 0.35)',
                    }}
                    aria-hidden="true"
                  >
                    <DeviceFlatIcon type={feat.iconType} className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          §3 WHY AZEEBO+ (Orange App Mockup Window + 3 Features)
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto"
        aria-label="Why choose Azeebo+"
      >
        <ScrollReveal direction="up">
          <div className="text-center mb-14">
            <span
              className="text-xs font-bold uppercase tracking-widest block mb-2"
              style={{ color: 'var(--brand-orange)' }}
            >
              EXPERIENCE THE PLATFORM
            </span>
            <h2
              className="az-headline font-extrabold uppercase"
              style={{
                color: 'var(--brand-white)',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
              }}
            >
              WHY AZEEBO+
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
            {/* Left: The Orange Container with inset dark macOS app window */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div
                className="relative rounded-3xl p-5 sm:p-7 w-full max-w-lg"
                style={{
                  background: 'linear-gradient(145deg, #E5251C 0%, #F3501A 45%, #FF6B00 100%)',
                  boxShadow: '0 20px 60px rgba(229, 37, 28, 0.35)',
                }}
              >
                {/* Inset dark app window */}
                <div
                  className="rounded-2xl p-4 sm:p-6"
                  style={{
                    background: '#0D0B12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {/* Window control dots */}
                  <div className="flex items-center gap-2 mb-6" aria-hidden="true">
                    <span className="w-3 h-3 rounded-full" style={{ background: '#EF4444' }} />
                    <span className="w-3 h-3 rounded-full" style={{ background: '#F59E0B' }} />
                    <span className="w-3 h-3 rounded-full" style={{ background: '#10B981' }} />
                  </div>

                  {/* Simulated App Content Rows */}
                  <div className="space-y-4">
                    <div
                      className="h-4 w-3/4 rounded-md"
                      style={{ background: 'rgba(255, 255, 255, 0.12)' }}
                    />
                    <div
                      className="h-3 w-1/2 rounded-md"
                      style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                    />

                    {/* Active highlighted action bar with hover cursor */}
                    <div className="relative pt-2">
                      <div
                        className="h-9 w-full rounded-lg flex items-center px-4"
                        style={{ background: '#FF6B00' }}
                      >
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          CONTINUE WATCHING &bull; EPISODE 4
                        </span>
                      </div>

                      {/* Animated White Cursor Pointer */}
                      <motion.div
                        className="absolute -right-3 top-5 text-white drop-shadow-lg"
                        style={{ fontSize: 24 }}
                        animate={{ x: [0, -6, 0], y: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                        aria-hidden="true"
                      >
                        ↖
                      </motion.div>
                    </div>

                    <div
                      className="h-3 w-5/6 rounded-md"
                      style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                    />
                    <div
                      className="h-3 w-2/3 rounded-md"
                      style={{ background: 'rgba(255, 255, 255, 0.06)' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: 3 Feature Bullet Points */}
            <div className="w-full lg:w-1/2 space-y-8">
              {[
                {
                  title: 'Stream Anytime, Anywhere',
                  desc: 'Enjoy instant access to an expansive library of African cinema and international hits without ads or interruptions.',
                },
                {
                  title: 'Offline Downloads & 4K Quality',
                  desc: 'Download your favorite movies and shows to watch on flights, road trips, or off-grid in crisp high definition.',
                },
                {
                  title: 'Multi-Profile Family Sharing',
                  desc: 'Create unique profiles for everyone in your household with custom recommendations and parental controls.',
                },
              ].map((item) => (
                <div key={item.title} className="flex flex-col gap-1.5">
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  <p
                    className="text-sm sm:text-base leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          §4 EXPLORE OUR WIDE VARIETY OF CATEGORIES (5 Universes)
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto"
        aria-label="Browse Azeebo+ Universes"
      >
        <ScrollReveal direction="up">
          {/* Header with BROWSE ALL button */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
            <div>
              <span
                className="text-xs font-bold uppercase tracking-widest block mb-2"
                style={{ color: 'var(--brand-orange)' }}
              >
                CATEGORIES
              </span>
              <h2
                className="az-headline font-extrabold uppercase"
                style={{
                  color: 'var(--brand-white)',
                  fontSize: 'clamp(1.5rem, 3.2vw, 2.5rem)',
                }}
              >
                EXPLORE OUR WIDE VARIETY OF CATEGORIES
              </h2>
            </div>
            <Link href="/browse">
              <motion.button
                type="button"
                className="az-btn-primary flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
              >
                <span>BROWSE ALL</span>
                <span aria-hidden="true">&rarr;</span>
              </motion.button>
            </Link>
          </div>

          {/* Exactly 5 Category Cards (2x2 Quad of Real Mini Posters inside each) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
            {UNIVERSE_CATEGORIES.map((cat, i) => (
              <Link key={cat.name} href={cat.slug} className="group">
                <motion.div
                  className="rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-300"
                  style={{
                    background: 'var(--hp-card-bg)',
                    border: '1px solid var(--hp-card-border)',
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  whileHover={{ translateY: -4, borderColor: 'rgba(255, 107, 0, 0.4)' }}
                >
                  {/* 2x2 Mini Poster Quad with Real Images */}
                  <div className="grid grid-cols-2 gap-2 mb-4 rounded-xl overflow-hidden">
                    {cat.miniPosters.map((mini, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-lg overflow-hidden flex items-center justify-center text-center p-1"
                        style={{
                          aspectRatio: '3 / 4',
                          background: '#1F2937',
                        }}
                      >
                        <Image
                          src={mini.image}
                          alt={mini.title}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                        <div
                          className="absolute inset-x-0 bottom-0 py-0.5 px-1 z-10"
                          style={{
                            background:
                              'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
                          }}
                        >
                          <p className="text-[8px] font-bold text-white truncate drop-shadow">
                            {mini.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom bar: Title + Arrow */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-bold text-white group-hover:text-[var(--brand-orange)] transition-colors">
                      {cat.name}
                    </span>
                    <span
                      className="text-sm text-white/50 group-hover:text-white transition-colors"
                      aria-hidden="true"
                    >
                      &rarr;
                    </span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          §5 SHOWCASE GALLERY MOSAIC + MARQUEE TICKER
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative py-16 sm:py-24 overflow-hidden"
        aria-label="Trending gallery showcase"
      >
        <AmbientGlow
          color="rgba(243, 80, 26, 0.18)"
          size={700}
          className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />

        {/* Continuous Marquee Ticker */}
        <div className="w-full overflow-hidden py-3 border-y border-white/5 bg-black/40 mb-12">
          <div className="az-marquee text-xs sm:text-sm font-bold uppercase tracking-widest text-white/70">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="inline-flex items-center gap-6 mr-6">
                <span>POPULAR MOVIES</span>
                <span className="text-[var(--brand-orange)]">&bull;</span>
                <span>TOP SHOWS THIS WEEK</span>
                <span className="text-[var(--brand-orange)]">&bull;</span>
                <span>TRENDING NOW</span>
                <span className="text-[var(--brand-orange)]">&bull;</span>
                <span>EXCLUSIVE ORIGINALS</span>
                <span className="text-[var(--brand-orange)]">&bull;</span>
              </span>
            ))}
          </div>
        </div>

        {/* Staggered Offset Gallery Mosaic (8 Real Images) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4.5">
            {GALLERY_MOSAIC_ITEMS.map((item, idx) => (
              <motion.div
                key={item.id}
                className="relative rounded-2xl overflow-hidden group cursor-pointer"
                style={{
                  aspectRatio: idx % 2 === 0 ? '4 / 5' : '5 / 6',
                  background: '#18151e',
                  marginTop: idx % 2 === 1 ? '1.25rem' : '0',
                }}
                whileHover={{ scale: 1.03, zIndex: 10 }}
                transition={{ duration: 0.25 }}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />

                {/* Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-black/60 text-white backdrop-blur-sm">
                    {item.badge}
                  </span>
                </div>

                {/* Bottom Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10">
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="text-xs text-white/60">{item.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          §6 FREQUENTLY ASKED QUESTIONS (2 Columns x 4 Rows = 8 Items)
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto"
        aria-label="Frequently Asked Questions"
      >
        <ScrollReveal direction="up">
          <div className="text-center mb-14">
            <span
              className="text-xs font-bold uppercase tracking-widest block mb-2"
              style={{ color: 'var(--brand-orange)' }}
            >
              GET ANSWERS
            </span>
            <h2
              className="az-headline font-extrabold uppercase"
              style={{
                color: 'var(--brand-white)',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
              }}
            >
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>

          {/* 2-Column Grid for 8 FAQ Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {FAQ_ITEMS_8.map((item) => {
              const isOpen = openFaq === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl overflow-hidden transition-all duration-200"
                  style={{
                    background: 'var(--hp-faq-item-bg)',
                    border: '1px solid var(--hp-faq-item-border)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? '' : item.id)}
                    className="w-full flex items-center justify-between p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)]"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold font-mono text-white/50">{item.num}</span>
                      <span className="font-semibold text-sm sm:text-base text-white">
                        {item.question}
                      </span>
                    </div>
                    <span className="text-xl text-white/60 font-light" aria-hidden="true">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 pt-1 text-sm leading-relaxed text-white/70 pl-11">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          §7 READY TO ENTER YOUR UNIVERSE? (App Download + Hand Mockup)
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto overflow-hidden"
        aria-label="Download the Azeebo+ app"
      >
        <ScrollReveal direction="up">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
            {/* Left Column: Heading & Download Buttons */}
            <div className="w-full lg:w-1/2 text-left">
              <span
                className="text-xs font-bold uppercase tracking-widest block mb-3"
                style={{ color: 'var(--brand-orange)' }}
              >
                AVAILABLE ON ALL PLATFORMS
              </span>
              <h2
                className="az-headline font-extrabold leading-tight mb-5"
                style={{
                  color: 'var(--brand-white)',
                  fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
                }}
              >
                Ready to Enter Your Universe?
              </h2>
              <p className="text-sm sm:text-base leading-relaxed mb-8 text-white/70 max-w-lg">
                Download the Azeebo+ app now and start your 7-day free trial today. Stream
                seamlessly, vote in reality shows, and earn rewards anywhere.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="#download"
                  className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition-colors group"
                >
                  <svg
                    className="w-6 h-6 fill-current text-white group-hover:text-[var(--brand-orange)] transition-colors"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-.95 2.76.99.08 2.02-.51 2.68-1.26z" />
                  </svg>
                  <div className="text-left leading-tight">
                    <p className="text-[10px] text-white/60">Download on the</p>
                    <p className="text-sm font-bold text-white">App Store</p>
                  </div>
                </a>

                <a
                  href="#download"
                  className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition-colors group"
                >
                  <svg
                    className="w-6 h-6 fill-current text-white group-hover:text-[var(--brand-orange)] transition-colors"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a2.38 2.38 0 0 1-.61-.714V2.528c.17-.282.38-.528.61-.714zm11.24 11.24l2.128 2.129-12.016 6.94 9.888-9.069zm0-2.108L4.96 1.878l12.016 6.94-2.127 2.128zm1.094 1.054l3.197 1.848a1.59 1.59 0 0 1 0 2.296l-3.197 1.848-1.414-1.414 1.414-4.578z" />
                  </svg>
                  <div className="text-left leading-tight">
                    <p className="text-[10px] text-white/60">GET IT ON</p>
                    <p className="text-sm font-bold text-white">Google Play</p>
                  </div>
                </a>

                <Link href="/auth/register">
                  <button
                    type="button"
                    className="az-btn-primary px-6 py-3.5 rounded-xl text-sm font-semibold"
                  >
                    Start on Web
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Column: High-Res Smartphone held in hand */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="relative w-full max-w-sm aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/hand_phone_mockup.jpg"
                  alt="Azeebo+ mobile application running on a modern smartphone held in hand"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 420px"
                  priority
                />
                {/* Natural dark vignette fade on edges */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: 'inset 0 0 60px rgba(8, 6, 10, 0.85)',
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          §8 LOVED & TRUSTED (2 Side-by-Side Testimonial Cards)
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto"
        aria-label="Loved & trusted testimonials"
      >
        <ScrollReveal direction="up">
          <h2
            className="az-headline font-extrabold mb-12"
            style={{
              color: 'var(--brand-white)',
              fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
            }}
          >
            Loved &amp; trusted
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Review 1 */}
            <div
              className="p-8 rounded-3xl flex flex-col justify-between"
              style={{
                background: 'var(--hp-testi-card-bg)',
                border: '1px solid var(--hp-testi-card-border)',
              }}
            >
              <p className="text-base sm:text-lg leading-relaxed text-white/85 mb-8">
                &ldquo;The variety of African stories combined with international blockbusters makes
                Azeebo+ unmatched. The streaming quality is butter-smooth even on mobile
                data.&rdquo;
              </p>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src="/images/placeholders/avatars/100x100_01.png"
                      alt="David O."
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">David O.</p>
                    <p className="text-xs text-white/50">Product Lead &bull; Lagos</p>
                  </div>
                </div>
                <div className="text-xs text-white/40 font-semibold tracking-wider uppercase">
                  Salesforce Verified
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div
              className="p-8 rounded-3xl flex flex-col justify-between"
              style={{
                background: 'var(--hp-testi-card-bg)',
                border: '1px solid var(--hp-testi-card-border)',
              }}
            >
              <p className="text-base sm:text-lg leading-relaxed text-white/85 mb-8">
                &ldquo;Azeebo+ has completely replaced other streaming services for our family. The
                reality voting and live events are unlike anything else we&apos;ve
                experienced.&rdquo;
              </p>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src="/images/placeholders/avatars/100x100_02.png"
                      alt="Sarah K."
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Sarah K.</p>
                    <p className="text-xs text-white/50">Creative Director &bull; London</p>
                  </div>
                </div>
                <div className="text-xs text-white/40 font-semibold tracking-wider uppercase">
                  Early Adopter
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          §9 SIGNUP FOR THE NEWSLETTER (Red Nebula Glow on Left)
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative py-12 sm:py-16 px-4 sm:px-8 max-w-7xl mx-auto"
        aria-label="Newsletter Subscription"
      >
        <ScrollReveal direction="up">
          <div
            className="relative rounded-3xl p-8 sm:p-14 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
            style={{
              background: '#120E17',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Radiant Red/Pink Liquid Glow Aura on the Left */}
            <div
              className="absolute -left-20 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
              style={{
                width: '450px',
                height: '450px',
                background:
                  'radial-gradient(circle, #CC1C1C 0%, #E8420A 40%, rgba(204, 28, 28, 0) 70%)',
                filter: 'blur(70px)',
                opacity: 0.85,
              }}
              aria-hidden="true"
            />

            {/* Left Content */}
            <div className="relative z-10 max-w-md">
              <h2
                className="az-headline font-extrabold text-white leading-tight mb-3"
                style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)' }}
              >
                Signup for the newsletter
              </h2>
              <p className="text-sm text-white/70">
                Stay up to date with new releases, universe updates, and exclusive perks.
              </p>
            </div>

            {/* Right Form */}
            <div className="relative z-10 w-full md:w-auto min-w-[320px]">
              {emailSubmitted ? (
                <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 text-sm font-medium flex items-center gap-2.5">
                  <svg
                    className="w-4 h-4 fill-none stroke-current stroke-[2.5]"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>You&apos;re subscribed to the Azeebo+ newsletter!</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletter} noValidate className="flex flex-col gap-2">
                  <div className="relative flex items-center border-b border-white/30 focus-within:border-[var(--brand-orange)] pb-2 transition-colors">
                    <input
                      type="email"
                      value={emailValue}
                      onChange={(e) => {
                        setEmailValue(e.target.value);
                        setEmailError('');
                      }}
                      placeholder="Enter your email"
                      className="bg-transparent text-white placeholder-white/40 text-sm w-full outline-none pr-8"
                      aria-label="Email address for newsletter"
                      required
                    />
                    <button
                      type="submit"
                      className="text-white hover:text-[var(--brand-orange)] transition-colors text-lg"
                      aria-label="Submit newsletter subscription"
                    >
                      &rarr;
                    </button>
                  </div>
                  {emailError && <span className="text-xs text-red-400 mt-1">{emailError}</span>}
                </form>
              )}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          §10 COMPREHENSIVE AZEEBO+ FOOTER
          ═══════════════════════════════════════════════════════════ */}
      <AppFooter siteName={siteName} logoVariant="light" />
    </div>
  );
}
