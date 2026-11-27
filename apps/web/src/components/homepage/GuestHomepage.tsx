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
import { Play } from 'lucide-react';

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
    image: '/images/poster_ember_queen.webp',
  },
  {
    id: 'p2',
    title: 'Neo Lagos 2099',
    genre: 'Afro-Cyberpunk',
    rating: '4.8',
    image: '/images/poster_neo_lagos.webp',
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
      { title: 'The Ember Queen', image: '/images/poster_ember_queen.webp' },
      { title: 'Neo Lagos 2099', image: '/images/poster_neo_lagos.webp' },
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
    image: '/images/poster_neo_lagos.webp',
    badge: 'TRENDING',
  },
  {
    id: 'g3',
    title: 'The Monolith',
    subtitle: 'Art & Culture',
    image: '/images/brand_hero.webp',
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
    image: '/images/poster_ember_queen.webp',
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
  const [posters, setPosters] = useState<PosterItem[]>(HERO_POSTERS_24);

  useEffect(() => {
    let isMounted = true;
    async function loadPosters() {
      try {
        const res = await fetch('/api/homepage/posters');
        const json = await res.json();
        if (json.success && json.data?.length > 0 && isMounted) {
          setPosters(json.data);
        }
      } catch {
        // Keep fallback posters
      }
    }
    loadPosters();
    return () => {
      isMounted = false;
    };
  }, []);

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
    <div className="min-h-screen overflow-x-hidden bg-az-surface-root text-az-ink">
      {/* ── Offline Banner ── */}
      {!isOnline && (
        <motion.div
          role="alert"
          className="text-center py-2 px-4 text-sm font-medium sticky top-0 z-50 bg-az-warning-400 text-az-surface-root"
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
            className="az-glass fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 p-4 z-50"
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
                <p className="az-body-strong text-az-ink">Install {siteName}</p>
                <p className="az-caption truncate text-az-ink-muted">
                  Stream your universe with offline mode
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowInstallPrompt(false)}
                  className="px-3 py-1.5 rounded-az-pill az-caption text-az-ink-muted hover:text-az-ink transition-colors"
                >
                  Later
                </button>
                <button
                  type="button"
                  onClick={handleInstall}
                  className="az-btn-primary az-btn-primary--inline az-btn-primary--sm"
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
        className="relative w-full overflow-hidden pt-24 sm:pt-32 lg:pt-36 pb-36 sm:pb-48 lg:pb-56"
        style={{
          background:
            'radial-gradient(ellipse at 50% 20%, color-mix(in srgb, var(--color-az-flame) 15%, transparent) 0%, color-mix(in srgb, var(--color-az-surface-root) 98%, transparent) 75%)',
        }}
        aria-label="Hero: One Platform. Endless Universes."
      >
        <AmbientGlow
          color="color-mix(in srgb, var(--color-az-scarlet) 22%, transparent)"
          size={650}
          className="-top-32 left-1/2 -translate-x-1/2"
        />

        <motion.div
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-5"
          style={{ y: heroY }}
        >
          {/* Centered Main Headline */}
          <h1 className="az-headline text-az-ink text-4xl sm:text-5xl lg:az-hero">
            One Platform. Endless Universes.
          </h1>

          {/* Subtitle matching Figma Desktop specification */}
          <p className="az-body sm:az-lead max-w-2xl text-az-ink-muted">
            Discover movies, comedy, reality TV, sports, music, games, live entertainment, and
            immersive storyworlds—all in one place.
          </p>

          {/* Dual CTAs matching Figma Desktop: Get Started + How it works */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/auth/register" tabIndex={-1}>
              <motion.button
                type="button"
                className="az-btn-primary az-btn-primary--inline az-ripple flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                aria-label="Get Started"
              >
                <span>Get Started</span>
                <span aria-hidden="true">&rarr;</span>
              </motion.button>
            </Link>

            <a
              href="#devices"
              className="az-btn-secondary flex items-center gap-2"
              aria-label="How it works"
            >
              <span
                className="flex size-5 items-center justify-center rounded-full bg-az-flame/20 text-xs text-az-flame"
                aria-hidden="true"
              >
                <Play className="size-3 fill-current" />
              </span>
              <span>How it works</span>
            </a>
          </div>

          {/* 8x3 Poster Wall Grid (24 Real Images) — scaled sleekly */}
          <div className="w-full max-w-5xl mx-auto mt-6 relative">
            <div
              className="grid grid-cols-8 gap-1.5 sm:gap-2"
              role="img"
              aria-label="Grid of 24 trending movies, shows and universes"
            >
              {posters.map((poster) => (
                <div
                  key={poster.id}
                  className="relative aspect-[2/3] rounded-az-card overflow-hidden group transition-transform duration-300 hover:scale-105 hover:z-20 cursor-pointer bg-az-surface-panel shadow-az-lifted"
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
                    <span className="inline-flex items-center gap-1 rounded-az-chip bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-az-warning-400">
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
                  <div className="az-scrim absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end p-1.5">
                    <p className="text-[10px] truncate font-bold leading-tight text-az-ink">
                      {poster.title}
                    </p>
                    <p className="truncate text-[8px] leading-none mt-0.5 text-az-ink-muted">
                      {poster.genre}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Seamless gradient fade out into the next section */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-az-surface-root"
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
              <span className="az-overline mb-3 block text-az-flame">CREATE</span>
              <h2 className="az-headline uppercase text-az-ink text-3xl sm:text-4xl lg:az-display">
                WE PROVIDE YOU STREAMING EXPERIENCE ACROSS VARIOUS DEVICES.
              </h2>
            </div>
            <div className="lg:w-5/12 pt-2">
              <p className="az-body sm:az-lead text-az-ink-muted">
                With Azeebo+, you can enjoy your favorite movies and TV shows anytime, anywhere. Our
                platform is designed to be compatible with a wide range of devices, ensuring that
                you never miss a moment of entertainment.
              </p>
            </div>
          </div>

          {/* 3x2 Grid of 6 Device Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {DEVICE_FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="az-glass flex flex-col justify-between p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ translateY: -3 }}
              >
                <div>
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-az-control border border-az-scarlet/25 bg-az-scarlet/15 text-az-flame"
                    aria-hidden="true"
                  >
                    <DeviceFlatIcon type={feat.iconType} className="w-6 h-6" />
                  </div>
                  <h3 className="az-title mb-2 text-az-ink">{feat.title}</h3>
                  <p className="az-body text-az-ink-muted">{feat.desc}</p>
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
            <span className="az-overline mb-2 block text-az-flame">SMART SUGGESTIONS</span>
            <h2 className="az-headline uppercase text-az-ink text-3xl sm:text-4xl lg:az-display">
              WHY AZEEBO+
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
            {/* Left: The brand-gradient container with inset dark macOS app window */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="relative w-full max-w-lg rounded-az-feature bg-gradient-to-br from-az-scarlet to-az-flame p-5 shadow-az-glow sm:p-7">
                {/* Inset dark app window — a static illustration of the app, not
                    a live control. The fake chrome and its labels are hidden from
                    assistive tech (and from contrast readers) as decoration. */}
                <div
                  className="rounded-az-panel border border-az-ink/10 bg-az-surface-root p-4 sm:p-6"
                  aria-hidden="true"
                >
                  {/* Window control dots */}
                  <div className="flex items-center gap-2 mb-6" aria-hidden="true">
                    <span className="h-3 w-3 rounded-full bg-az-error-500" />
                    <span className="h-3 w-3 rounded-full bg-az-warning-500" />
                    <span className="h-3 w-3 rounded-full bg-az-success-500" />
                  </div>

                  {/* Simulated App Content Rows */}
                  <div className="space-y-4">
                    <div className="h-4 w-3/4 rounded-az-card bg-az-ink/10" />
                    <div className="h-3 w-1/2 rounded-az-card bg-az-ink/5" />

                    {/* Active highlighted action bar with hover cursor */}
                    <div className="relative pt-2">
                      <div className="flex h-9 w-full items-center rounded-az-card bg-az-flame px-4">
                        {/* Ink on flame: white would be 3.18:1 and unreadable at
                            this size. */}
                        <span className="az-overline text-az-surface-root">
                          CONTINUE WATCHING &bull; EPISODE 4
                        </span>
                      </div>

                      {/* Animated White Cursor Pointer */}
                      <motion.div
                        className="absolute -right-3 top-5 text-2xl text-az-ink drop-shadow-lg"
                        animate={{ x: [0, -6, 0], y: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                        aria-hidden="true"
                      >
                        ↖
                      </motion.div>
                    </div>

                    <div className="h-3 w-5/6 rounded-az-card bg-az-ink/5" />
                    <div className="h-3 w-2/3 rounded-az-card bg-az-ink/5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: 3 Feature Bullet Points matching Figma Desktop specifications */}
            <div className="w-full lg:w-1/2 space-y-8">
              {[
                {
                  title: 'Fast & Smooth Streaming',
                  desc: 'Enjoy instant access to ultra-high-definition streaming optimized for low-latency playback even on variable mobile connections.',
                },
                {
                  title: 'Watch Anywhere',
                  desc: 'Download your favorite movies and episodes for offline viewing across flights, road trips, or off-grid entertainment.',
                },
                {
                  title: 'New Content Regularly',
                  desc: 'Fresh Nollywood premieres, weekly reality show drops, live sports matches, and creator exclusives updated daily.',
                },
              ].map((item) => (
                <div key={item.title} className="flex flex-col gap-1.5">
                  <h3 className="az-title text-az-ink">{item.title}</h3>
                  <p className="az-body sm:az-lead text-az-ink-muted">{item.desc}</p>
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
          {/* Header matching Figma Desktop: high-quality + explore now */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
            <div>
              <span className="az-overline mb-2 block text-az-flame">HIGH-QUALITY</span>
              <h2 className="az-headline uppercase text-az-ink text-2xl sm:text-3xl lg:text-4xl">
                EXPLORE OUR WIDE VARIETY OF CATEGORIES
              </h2>
            </div>
            <Link href="/browse">
              <motion.button
                type="button"
                className="az-btn-primary az-btn-primary--inline flex items-center gap-2 uppercase tracking-wider"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
              >
                <span>explore now</span>
                <span aria-hidden="true">&rarr;</span>
              </motion.button>
            </Link>
          </div>

          {/* Exactly 5 Category Cards (2x2 Quad of Real Mini Posters inside each) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
            {UNIVERSE_CATEGORIES.map((cat, i) => (
              <Link key={cat.name} href={cat.slug} className="group">
                <motion.div
                  className="az-glass flex flex-col justify-between p-3.5"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  whileHover={{ translateY: -4 }}
                >
                  {/* 2x2 Mini Poster Quad with Real Images */}
                  <div className="mb-4 grid grid-cols-2 gap-2 overflow-hidden rounded-az-panel">
                    {cat.miniPosters.map((mini, idx) => (
                      <div
                        key={idx}
                        className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-az-card bg-az-surface-panel p-1"
                      >
                        <Image
                          src={mini.image}
                          alt={mini.title}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                        <div className="az-scrim absolute inset-x-0 bottom-0 z-10 px-1 py-0.5">
                          <p className="truncate text-[8px] font-bold text-az-ink drop-shadow">
                            {mini.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom bar: Title + Arrow */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="az-body-strong text-az-ink transition-colors group-hover:text-az-flame">
                      {cat.name}
                    </span>
                    <span
                      className="az-body text-az-ink-muted transition-colors group-hover:text-az-ink"
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
          color="color-mix(in srgb, var(--color-az-flame) 18%, transparent)"
          size={700}
          className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />

        {/* Signature Display Headline matching Figma Desktop */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center mb-8">
          <span className="az-overline mb-2 block text-az-flame">IMMERSIVE WORLDS</span>
          <h2 className="az-headline uppercase text-az-ink text-3xl sm:text-4xl lg:text-5xl flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <span>Enter A World</span>
            <span className="text-az-flame text-xl sm:text-2xl" aria-hidden="true">
              &#9733;
            </span>
            <span>Beyond The</span>
            <span className="text-az-flame text-xl sm:text-2xl" aria-hidden="true">
              &#9733;
            </span>
            <span>Screen</span>
          </h2>
        </div>

        {/* Continuous Marquee Ticker */}
        <div className="w-full overflow-hidden py-3 border-y border-az-ink/5 bg-black/40 mb-12">
          <div className="az-marquee az-overline text-az-ink-muted">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="inline-flex items-center gap-6 mr-6">
                <span>POPULAR MOVIES</span>
                <span className="text-az-flame">&bull;</span>
                <span>TOP SHOWS THIS WEEK</span>
                <span className="text-az-flame">&bull;</span>
                <span>TRENDING NOW</span>
                <span className="text-az-flame">&bull;</span>
                <span>EXCLUSIVE ORIGINALS</span>
                <span className="text-az-flame">&bull;</span>
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
                className={`group relative cursor-pointer overflow-hidden rounded-az-panel bg-az-surface-panel ${
                  idx % 2 === 0 ? 'aspect-[4/5]' : 'mt-5 aspect-[5/6]'
                }`}
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
                  <span className="rounded-az-chip bg-black/60 px-2 py-1 text-[10px] font-bold text-az-ink backdrop-blur-sm">
                    {item.badge}
                  </span>
                </div>

                {/* Bottom Overlay */}
                <div className="az-scrim--hero absolute inset-x-0 bottom-0 z-10 p-4">
                  <p className="az-body-strong text-az-ink">{item.title}</p>
                  <p className="az-caption text-az-ink-muted">{item.subtitle}</p>
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
            <span className="az-overline mb-2 block text-az-flame">GET ANSWERS</span>
            <h2 className="az-headline uppercase text-az-ink text-3xl sm:text-4xl lg:az-display">
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
                  className="overflow-hidden rounded-az-panel border border-az-glass-border bg-az-glass-fill"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? '' : item.id)}
                    className="w-full flex items-center justify-between p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-az-scarlet"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs font-bold text-az-ink-muted">
                        {item.num}
                      </span>
                      <span className="az-body-strong text-az-ink sm:text-base">
                        {item.question}
                      </span>
                    </div>
                    <span className="text-xl font-light text-az-ink-muted" aria-hidden="true">
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
                        <p className="az-body px-5 pb-5 pt-1 pl-11 text-az-ink-muted">
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
          §7 LOVED & TRUSTED (2 Side-by-Side Testimonial Cards)
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto"
        aria-label="Loved & trusted testimonials"
      >
        <ScrollReveal direction="up">
          <h2 className="az-headline mb-12 text-az-ink text-5xl sm:text-6xl lg:text-7xl">
            Loved &amp; trusted
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Review 1 */}
            <div className="az-glass flex flex-col justify-between p-8">
              <p className="az-lead mb-8 text-az-ink-dim sm:text-lg">
                &ldquo;The variety of African stories combined with international blockbusters makes
                Azeebo+ unmatched. The streaming quality is butter-smooth even on mobile
                data.&rdquo;
              </p>

              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full">
                    <Image
                      src="/images/placeholders/avatars/100x100_01.png"
                      alt="David O."
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="az-body-strong text-az-ink">David O.</p>
                    <p className="az-caption text-az-ink-muted">Product Lead &bull; Lagos</p>
                  </div>
                </div>
                <div className="az-overline text-az-ink-muted">Salesforce Verified</div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="az-glass flex flex-col justify-between p-8">
              <p className="az-lead mb-8 text-az-ink-dim sm:text-lg">
                &ldquo;Azeebo+ has completely replaced other streaming services for our family. The
                reality voting and live events are unlike anything else we&apos;ve
                experienced.&rdquo;
              </p>

              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full">
                    <Image
                      src="/images/placeholders/avatars/100x100_02.png"
                      alt="Sarah K."
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="az-body-strong text-az-ink">Sarah K.</p>
                    <p className="az-caption text-az-ink-muted">Creative Director &bull; London</p>
                  </div>
                </div>
                <div className="az-overline text-az-ink-muted">Early Adopter</div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          §8 SIGNUP FOR THE NEWSLETTER (Red Nebula Glow on Left)
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative py-12 sm:py-16 px-4 sm:px-8 max-w-7xl mx-auto"
        aria-label="Newsletter Subscription"
      >
        <ScrollReveal direction="up">
          <div className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-az-feature border border-az-glass-border bg-az-surface-raised p-8 md:flex-row sm:p-14">
            {/* Radiant Red/Pink Liquid Glow Aura on the Left */}
            <div
              className="pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: '450px',
                height: '450px',
                background:
                  'radial-gradient(circle, var(--color-az-scarlet) 0%, var(--color-az-flame) 40%, transparent 70%)',
                filter: 'blur(70px)',
                opacity: 0.85,
              }}
              aria-hidden="true"
            />

            {/* Left Content */}
            <div className="relative z-10 max-w-md">
              <h2 className="az-headline mb-3 text-az-ink text-3xl sm:text-4xl">
                Signup for the newsletter
              </h2>
              <p className="az-body text-az-ink-muted">
                Stay up to date with new releases, universe updates, and exclusive perks.
              </p>
            </div>

            {/* Right Form */}
            <div className="relative z-10 w-full min-w-[320px] md:w-auto">
              {emailSubmitted ? (
                <div className="az-body-strong flex items-center gap-2.5 rounded-az-panel border border-az-success-500/30 bg-az-success-500/20 p-4 text-az-success-400">
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
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      value={emailValue}
                      onChange={(e) => {
                        setEmailValue(e.target.value);
                        setEmailError('');
                      }}
                      placeholder="Enter your email"
                      className="az-input az-input--trailing"
                      aria-label="Email address for newsletter"
                      required
                    />
                    <button
                      type="submit"
                      className="absolute right-2 flex size-9 items-center justify-center rounded-full text-lg text-az-ink transition-colors hover:text-az-scarlet"
                      aria-label="Submit newsletter subscription"
                    >
                      &rarr;
                    </button>
                  </div>
                  {emailError && (
                    <span className="az-caption mt-1 text-az-error-400">{emailError}</span>
                  )}
                </form>
              )}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          §9 READY TO ENTER YOUR UNIVERSE? (App Download + Hand Mockup)
          ═══════════════════════════════════════════════════════════ */}
      <section
        id="download"
        className="relative py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto overflow-hidden"
        aria-label="Download the Azeebo+ app"
      >
        <ScrollReveal direction="up">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
            {/* Left Column: Heading & Download Buttons */}
            <div className="w-full lg:w-1/2 text-left">
              <span className="az-overline mb-3 block text-az-flame">
                AVAILABLE ON ALL PLATFORMS
              </span>
              <h2 className="az-headline mb-5 text-az-ink text-4xl sm:text-5xl lg:text-6xl">
                Ready to Enter Your Universe?
              </h2>
              <p className="az-body sm:az-lead mb-8 max-w-lg text-az-ink-muted">
                Movies. Comedy. Sports. Reality. Games. entertainment. And worlds waiting to be
                explored. Download the Azeebo+ app now and start your 7-day free trial today.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <a href="#download" className="az-btn-social group text-left">
                  <svg
                    className="h-6 w-6 fill-current text-az-ink transition-colors group-hover:text-az-flame"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-.95 2.76.99.08 2.02-.51 2.68-1.26z" />
                  </svg>
                  <div className="text-left leading-tight">
                    <p className="text-[10px] text-az-ink-muted">Download on the</p>
                    <p className="az-body-strong text-az-ink">App Store</p>
                  </div>
                </a>

                <a href="#download" className="az-btn-social group text-left">
                  <svg
                    className="h-6 w-6 fill-current text-az-ink transition-colors group-hover:text-az-flame"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a2.38 2.38 0 0 1-.61-.714V2.528c.17-.282.38-.528.61-.714zm11.24 11.24l2.128 2.129-12.016 6.94 9.888-9.069zm0-2.108L4.96 1.878l12.016 6.94-2.127 2.128zm1.094 1.054l3.197 1.848a1.59 1.59 0 0 1 0 2.296l-3.197 1.848-1.414-1.414 1.414-4.578z" />
                  </svg>
                  <div className="text-left leading-tight">
                    <p className="text-[10px] uppercase text-az-ink-muted">GET IT ON</p>
                    <p className="az-body-strong text-az-ink">Google Play</p>
                  </div>
                </a>

                <Link href="/auth/register">
                  <button type="button" className="az-btn-primary az-btn-primary--inline">
                    GET STARTED
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Column: High-Res Smartphone held in hand */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-az-feature shadow-az-lifted">
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
                  className="pointer-events-none absolute inset-0"
                  style={{
                    boxShadow:
                      'inset 0 0 60px color-mix(in srgb, var(--color-az-surface-root) 85%, transparent)',
                  }}
                  aria-hidden="true"
                />
              </div>
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
