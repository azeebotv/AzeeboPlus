'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useFlags } from '../../context/FlagsContext';
import { UNIVERSE_SLUGS } from '../../lib/flags';
import analytics from '../../lib/analytics';
import BrandLogo from '../auth/BrandLogo';
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket';

/* ─── Constants ─── */

// Header chrome expressed as token class pairs. The pre-token version drove
// these off inline styles plus the retired legacy brand aliases; they now sit
// on the generated `az-*` vocabulary (scarlet / flame / ink / surface-root).
const HEADER_BAR_HEIGHT_CLS = 'h-[68px]';
const HEADER_BAR_HEIGHT_SCROLLED_CLS = 'h-14';

const HEADER_LINK_CLS =
  'relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200';
const HEADER_LINK_ACTIVE_CLS = 'text-az-ink bg-az-scarlet/14';
const HEADER_LINK_IDLE_CLS = 'text-az-ink/55 bg-transparent hover:text-az-ink/85';

// Floating menus: near-black frost at 97% with a 24px blur — the same surface
// treatment the migrated pages use for popovers.
const MENU_SURFACE_CLS = 'bg-az-surface-root/97 backdrop-blur-[24px]';

const MENU_ROW_CLS = 'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors';
const MENU_ROW_ACTIVE_CLS = 'text-az-flame bg-az-scarlet/10';
const MENU_ROW_IDLE_CLS = 'text-az-ink/60 bg-transparent hover:text-az-ink hover:bg-az-ink/4';

const MOBILE_NAV_ROW_CLS =
  'flex items-center gap-3 px-3 py-2.5 rounded-az-card text-sm font-medium transition-all';
const MOBILE_UNIVERSE_ROW_CLS =
  'flex items-center gap-3 px-3 py-2 rounded-az-card text-sm font-medium transition-all';
const MOBILE_ROW_ACTIVE_CLS = 'text-az-ink bg-az-scarlet/14';
const MOBILE_ROW_IDLE_CLS = 'text-az-ink/60 bg-transparent';

const ACTIVE_DOT_CLS = 'bg-az-flame';
const IDLE_DOT_CLS = 'bg-transparent';

// Canonical brand CTA (scarlet → flame) with the design system's glow shadow.
const CTA_CLS = 'bg-[image:var(--gradient-az-cta)] shadow-az-glow';

const ICON_ACTION_CLS =
  'p-2.5 rounded-az-card text-az-ink/50 hover:text-az-ink hover:bg-az-ink/6 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-az-flame';

/* ─── Helpers ─── */

function getInitials(name?: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function seededGradient(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${(hue + 40) % 360}, 60%, 40%))`;
}

function formatBalance(amount: number): string {
  if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `₦${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`;
  return `₦${amount.toLocaleString()}`;
}

/* ─── Profile menu icon component ─── */
function MenuIcon({
  type,
}: {
  type:
    | 'user'
    | 'star'
    | 'wallet'
    | 'creator'
    | 'settings'
    | 'subscription'
    | 'bell'
    | 'message'
    | 'trophy'
    | 'sparkles'
    | 'gift'
    | 'shield'
    | 'layers'
    | 'crown'
    | 'heart'
    | 'download';
}) {
  const cls = 'w-4 h-4 flex-shrink-0';
  switch (type) {
    case 'user':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
      );
    case 'star':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      );
    case 'wallet':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
          />
        </svg>
      );
    case 'creator':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
      );
    case 'settings':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'subscription':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"
          />
        </svg>
      );
    case 'bell':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
      );
    case 'message':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
          />
        </svg>
      );
    case 'trophy':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871a3.375 3.375 0 00-3.375-3.375H12m4.5 7.875H12M9 18.75V15.375c0-.621.504-1.125 1.125-1.125h.871M12 7.5A3.75 3.75 0 008.25 3.75h7.5A3.75 3.75 0 0012 7.5zM3.75 7.5a3.75 3.75 0 003.75 3.75M20.25 7.5a3.75 3.75 0 01-3.75 3.75"
          />
        </svg>
      );
    case 'sparkles':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        </svg>
      );
    case 'gift':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>
      );
    case 'shield':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
      );
    case 'layers':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.429 9.75L2.25 12l9.75 5.25 9.75-5.25-4.179-2.25m-11.321 4.5L2.25 16.5l9.75 5.25 9.75-5.25-4.179-2.25m-11.321-9L12 2.25l9.75 5.25-9.75 5.25-9.75-5.25z"
          />
        </svg>
      );
    case 'crown':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 19.5h16.5m-16.5-6l3-6 4.5 4.5 4.5-4.5 4.5 6H3.75z"
          />
        </svg>
      );
    case 'heart':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      );
    case 'download':
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
      );
  }
}

/* ─── AppHeader ─── */

export default function AppHeader({
  active: _active,
  logoVariant = 'light',
  logoHeight,
}: {
  active?: string;
  logoVariant?: 'light' | 'orange';
  logoHeight?: number;
}) {
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Real-time notification badge via WebSocket
  useNotificationsSocket({
    onNewNotification: useCallback((_notification: unknown) => {
      setUnreadCount((prev) => prev + 1);
    }, []),
    onUnreadCount: useCallback((count: number) => {
      setUnreadCount(count);
    }, []),
    onAllRead: useCallback(() => {
      setUnreadCount(0);
    }, []),
  });

  // Figma redesign (docs/design/figma-azeebo-screen-spec.md §4):
  // Universes ▾ · Watch · Live · Games · Rewards. Home lives on the logo,
  // Library/Predictions/Bundles remain reachable from the avatar menu.
  const NAV_LINKS = [
    { label: t('nav.browse'), href: '/browse' },
    { label: 'Live', href: '/live' },
    { label: t('universes.games'), href: '/games' },
    { label: t('nav.rewards'), href: '/rewards' },
    { label: 'Borrow', href: '/borrow' },
  ];

  // Per-slug presentation (label + route) for universes that have a web page.
  // Keys are canonical DB slugs, gated at render time by the `universe.<name>.enabled`
  // sentinels so admin toggles control which entries appear.
  const UNIVERSE_NAV_LINKS: Record<string, { label: string; href: string }> = {
    reality: { label: t('universes.reality'), href: '/reality' },
    creator: { label: t('nav.creators'), href: '/creators' },
    lifestyle: { label: t('universes.lifestyle'), href: '/lifestyle' },
    vertical: { label: t('universes.vertical'), href: '/vertical' },
    movie: { label: t('universes.movies'), href: '/movies' },
    games: { label: t('universes.games'), href: '/games' },
    comedy: { label: t('universes.comedy'), href: '/comedy' },
    sports: { label: t('universes.sports'), href: '/sports' },
    music: { label: t('universes.music'), href: '/music' },
    cinemaxis: { label: 'Cinemaxis', href: '/cinemaxis' },
  };

  // Derived from the shared slug map so every key is a canonical DB universe
  // slug (admin toggles reach exactly these keys).
  const ALL_UNIVERSE_OPTIONS = UNIVERSE_SLUGS.flatMap((key) => {
    const link = UNIVERSE_NAV_LINKS[key];
    return link ? [{ key, ...link }] : [];
  });

  const PROFILE_MENU_ITEMS: {
    label: string;
    href: string;
    icon:
      | 'user'
      | 'star'
      | 'wallet'
      | 'creator'
      | 'settings'
      | 'subscription'
      | 'bell'
      | 'message'
      | 'trophy'
      | 'sparkles'
      | 'gift'
      | 'shield'
      | 'layers'
      | 'crown'
      | 'heart'
      | 'download';
    creatorOnly?: boolean;
  }[] = [
    { label: t('nav.profile'), href: '/profile', icon: 'user' },
    { label: 'Notifications', href: '/notifications', icon: 'bell' },
    { label: 'Messages', href: '/messages', icon: 'message' },
    { label: 'Downloads', href: '/downloads', icon: 'download' },
    { label: 'For You', href: '/recommendations', icon: 'sparkles' },
    { label: 'Leaderboard', href: '/leaderboard', icon: 'trophy' },
    { label: 'Refer a Friend', href: '/referral', icon: 'gift' },
    { label: 'My Tips', href: '/tipping', icon: 'heart' },
    { label: 'Premium', href: '/premium', icon: 'crown' },
    { label: t('nav.rewards'), href: '/rewards', icon: 'star' },
    { label: t('nav.wallet'), href: '/wallet', icon: 'wallet' },
    { label: 'Borrow', href: '/borrow/account', icon: 'wallet' },
    { label: t('nav.subscription'), href: '/wallet/subscription-history', icon: 'subscription' },
    { label: 'Bundles & Passes', href: '/bundles', icon: 'layers' },
    { label: 'Moderation', href: '/moderation', icon: 'shield' },
    {
      label: t('nav.creatorDashboard'),
      href: '/creators/dashboard',
      icon: 'creator',
      creatorOnly: true,
    },
    { label: t('nav.settings'), href: '/settings', icon: 'settings' },
  ];

  const { user, isAuthenticated, logout } = useAuth();
  const { balance } = useWallet();
  const { universeEnabled } = useFlags();
  const pathname = usePathname();
  const router = useRouter();
  const isCreator = user?.role?.toLowerCase() === 'creator';

  // Per-universe nav gating: hide universes whose `universe.<name>.enabled`
  // sentinel flag is off (server-evaluated via /feature-flags/bootstrap).
  const UNIVERSE_OPTIONS = ALL_UNIVERSE_OPTIONS.filter((u) => universeEnabled(u.key));

  // UI state
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [universesOpen, setUniversesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const universeDropdownRef = useRef<HTMLDivElement>(null);
  const searchOverlayRef = useRef<HTMLDivElement>(null);

  /* ─── Scroll Effect ─── */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ─── Body scroll lock ─── */
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  /* ─── Close on route change ─── */
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
    setUniversesOpen(false);
    setSearchOpen(false);
    setConfirmLogout(false);
  }, [pathname]);

  /* ─── Keyboard: Esc closes overlays ─── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false);
          return;
        }
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
          hamburgerRef.current?.focus();
          return;
        }
        if (profileOpen) {
          setProfileOpen(false);
          return;
        }
        if (universesOpen) {
          setUniversesOpen(false);
          return;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, mobileMenuOpen, profileOpen, universesOpen]);

  /* ─── Click outside for dropdowns ─── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node))
        setProfileOpen(false);
      if (universeDropdownRef.current && !universeDropdownRef.current.contains(e.target as Node))
        setUniversesOpen(false);
    };
    if (profileOpen || universesOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen, universesOpen]);

  /* ─── Search auto-focus ─── */
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);

  /* ─── Search submit ─── */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchQuery('');
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  /* ─── Log out with confirmation ─── */
  const handleLogout = useCallback(() => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      return;
    }
    setConfirmLogout(false);
    setProfileOpen(false);
    logout();
  }, [confirmLogout, logout]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] border-t border-t-az-ink/4 backdrop-blur-[18px] backdrop-saturate-[180%] transition-all duration-500 ${
          scrolled
            ? 'bg-az-surface-root/92 border-b border-b-az-ink/10 shadow-az-sticky'
            : 'bg-az-surface-root/75 border-b border-b-az-ink/6 shadow-az-sticky-idle'
        }`}
        role="banner"
      >
        {/* ═══ Main Header Bar ═══ */}
        <div
          className={`relative mx-auto max-w-[1280px] ${
            scrolled ? HEADER_BAR_HEIGHT_SCROLLED_CLS : HEADER_BAR_HEIGHT_CLS
          }`}
        >
          {/* ─── 1. Brand Logo — pinned left ─── */}
          <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-10">
            <Link
              href="/"
              className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-az-flame focus-visible:ring-offset-2 focus-visible:ring-offset-az-surface-root rounded-lg transition-transform hover:scale-105"
              aria-label="Azeebo+ home"
            >
              <BrandLogo variant={logoVariant} height={logoHeight} />
            </Link>
          </div>

          {/* ─── 2+3. Center: Navigation + Universes (authenticated only) ─── */}
          {isAuthenticated && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="hidden lg:flex items-center gap-2">
                {/* Main Navigation */}
                <nav className="flex items-center gap-1" aria-label="Main navigation">
                  {NAV_LINKS.map((link) => {
                    const active = isActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() =>
                          analytics.navClicked({
                            label: link.label,
                            href: link.href,
                            position: 'header',
                          })
                        }
                        className={`${HEADER_LINK_CLS} ${active ? HEADER_LINK_ACTIVE_CLS : HEADER_LINK_IDLE_CLS}`}
                      >
                        {link.label}
                        {active && (
                          <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-az-flame" />
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* Divider */}
                <span className="w-px h-4 bg-az-glass-card mx-1" aria-hidden="true" />

                {/* Universes Dropdown */}
                <div className="relative" ref={universeDropdownRef}>
                  <button
                    onClick={() => setUniversesOpen((v) => !v)}
                    className={`${HEADER_LINK_CLS} flex items-center gap-2 ${
                      universesOpen ? HEADER_LINK_ACTIVE_CLS : HEADER_LINK_IDLE_CLS
                    }`}
                    aria-label="Browse universes"
                    aria-expanded={universesOpen}
                    aria-haspopup="true"
                  >
                    {t('appHeader.universes')}
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${universesOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {universesOpen && (
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 mt-2 w-48 rounded-az-panel border border-az-ink/[0.08] shadow-2xl py-1.5 z-50 ${MENU_SURFACE_CLS}`}
                      role="menu"
                      aria-label={t('appHeader.universes')}
                    >
                      {UNIVERSE_OPTIONS.map((u) => {
                        const active = isActive(u.href);
                        return (
                          <Link
                            key={u.key}
                            href={u.href}
                            prefetch={true}
                            onClick={() => setUniversesOpen(false)}
                            className={`${MENU_ROW_CLS} ${active ? MENU_ROW_ACTIVE_CLS : MENU_ROW_IDLE_CLS}`}
                            role="menuitem"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                active ? ACTIVE_DOT_CLS : IDLE_DOT_CLS
                              }`}
                            />
                            {u.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── 4. Utility / Action Section — pinned right ─── */}
          <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2 z-10">
            {isAuthenticated ? (
              <>
                {/* Search icon */}
                <button
                  onClick={() => setSearchOpen((v) => !v)}
                  className={ICON_ACTION_CLS}
                  aria-label={t('common.search')}
                  aria-expanded={searchOpen}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>

                {/* Messages icon */}
                <Link href="/messages" className={ICON_ACTION_CLS} aria-label="Messages">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                    />
                  </svg>
                </Link>

                {/* Notifications icon with real-time badge */}
                <Link
                  href="/notifications"
                  className={`relative ${ICON_ACTION_CLS}`}
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-az-ink bg-az-flame">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Cart / passes & bundles — Figma redesign */}
                <Link
                  href="/bundles"
                  onClick={() =>
                    analytics.navClicked({
                      label: 'cart',
                      href: '/bundles',
                      position: 'header',
                    })
                  }
                  className={ICON_ACTION_CLS}
                  aria-label="Passes, tickets and bundles"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                    />
                  </svg>
                </Link>

                {/* Wallet balance — desktop only */}
                <div className="hidden sm:flex items-center gap-0 px-3 py-1.5 rounded-full text-xs font-medium border border-az-ink/[0.06] bg-az-ink/4">
                  <span className="text-az-flame font-semibold whitespace-nowrap">
                    {formatBalance(balance?.balance ?? 0)}
                  </span>
                </div>

                {/* Profile icon with dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center justify-center w-9 h-9 rounded-full text-az-ink text-xs font-bold transition-all hover:ring-2 hover:ring-az-ink/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-az-flame"
                    style={{ background: seededGradient(user?.id || 'default') }}
                    aria-label="Profile menu"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                  >
                    {getInitials(user?.displayName || user?.name)}
                  </button>

                  {profileOpen && (
                    <div
                      className={`absolute right-0 mt-2 w-56 rounded-az-panel border border-az-ink/[0.08] shadow-2xl py-1.5 z-50 overflow-hidden ${MENU_SURFACE_CLS}`}
                      role="menu"
                      aria-label="User menu"
                    >
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-az-ink/[0.06]">
                        <p className="text-sm font-semibold text-az-ink truncate">
                          {user?.displayName || user?.name}
                        </p>
                        <p className="text-xs text-az-ink/40 truncate">{user?.email}</p>
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        {PROFILE_MENU_ITEMS.map((item) => {
                          if (item.creatorOnly && !isCreator) return null;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setProfileOpen(false)}
                              className={`${MENU_ROW_CLS} ${MENU_ROW_IDLE_CLS}`}
                              role="menuitem"
                            >
                              <MenuIcon type={item.icon} />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>

                      {/* Log out */}
                      <div className="border-t border-az-ink/[0.06] pt-1">
                        {!confirmLogout ? (
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-az-error-400 hover:text-az-error-300 hover:bg-az-error-500/10 transition-colors flex items-center gap-2.5"
                            role="menuitem"
                          >
                            <svg
                              className="w-4 h-4 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                              />
                            </svg>
                            {t('auth.logout')}
                          </button>
                        ) : (
                          <div className="px-4 py-2">
                            <p className="text-xs text-az-ink/50 mb-2">
                              {t('appHeader.confirmLogout')}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={handleLogout}
                                className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-az-ink bg-az-error-500 hover:bg-az-error-600 transition-colors"
                              >
                                {t('appHeader.yesSignOut')}
                              </button>
                              <button
                                onClick={() => setConfirmLogout(false)}
                                className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-az-ink/60 border border-az-ink/[0.1] hover:text-az-ink transition-colors"
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Guest: Sign up + Login buttons */
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="hidden sm:inline-flex px-4 py-1.5 rounded-full text-sm font-medium text-az-ink/60 hover:text-az-ink transition-colors border border-az-ink/[0.1]"
                >
                  {t('auth.login')}
                </Link>
                <Link
                  href="/auth/register"
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold text-az-ink transition-all hover:scale-105 ${CTA_CLS}`}
                >
                  {t('auth.register')}
                </Link>
              </div>
            )}

            {/* ─── Hamburger — mobile only ─── */}
            <button
              ref={hamburgerRef}
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-az-card text-az-ink/50 hover:text-az-ink hover:bg-az-ink/[0.06] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-az-flame"
              aria-label={mobileMenuOpen ? t('appHeader.closeMenu') : t('appHeader.openMenu')}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-drawer"
            >
              <div className="w-5 h-5 flex flex-col justify-center gap-[5px]">
                <span
                  className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 origin-center ${mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`}
                />
                <span
                  className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-0' : ''}`}
                />
                <span
                  className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 origin-center ${mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* ═══ Search Overlay ═══ */}
        <div
          ref={searchOverlayRef}
          className={`bg-az-surface-root/98 overflow-hidden transition-all duration-300 ${
            searchOpen ? 'max-h-[120px] border-t border-t-az-ink/6' : 'max-h-0 border-t-0'
          }`}
          role="search"
          aria-label="Site search"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-az-ink/30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder={t('appHeader.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 rounded-full text-sm text-az-ink placeholder:text-az-glass-placeholder bg-az-ink/[0.04] border border-az-ink/[0.08] focus:border-az-flame/50 focus:bg-az-ink/[0.07] outline-none transition-all"
                  aria-label={t('appHeader.searchAria')}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-az-ink/30 hover:text-az-ink hover:bg-az-glass-card transition-colors"
                    aria-label={t('appHeader.clearSearch')}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* ═══ Mobile Drawer ═══ */}
      <div
        className={`fixed inset-0 z-[101] lg:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!mobileMenuOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60"
          onClick={() => {
            setMobileMenuOpen(false);
            hamburgerRef.current?.focus();
          }}
        />

        {/* Drawer panel */}
        <div
          ref={drawerRef}
          id="mobile-drawer"
          className={`absolute top-0 left-0 right-0 transition-transform duration-300 ease-out border-b border-b-az-ink/7 ${MENU_SURFACE_CLS} ${
            mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4">
            {/* Search in mobile */}
            <form onSubmit={handleSearchSubmit} className="mb-4">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-az-ink/30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="search"
                  placeholder={t('appHeader.searchPlaceholderMobile')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm text-az-ink placeholder:text-az-glass-placeholder bg-az-ink/[0.04] border border-az-ink/[0.08] outline-none"
                  aria-label={t('appHeader.searchAria')}
                />
              </div>
            </form>

            {/* Main nav links (authenticated only) */}
            {isAuthenticated && (
              <nav aria-label="Main navigation" className="mb-2">
                {NAV_LINKS.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`${MOBILE_NAV_ROW_CLS} ${
                        active ? MOBILE_ROW_ACTIVE_CLS : MOBILE_ROW_IDLE_CLS
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          active ? ACTIVE_DOT_CLS : IDLE_DOT_CLS
                        }`}
                      />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Universes section (authenticated only) */}
            {isAuthenticated && (
              <>
                <p className="az-overline text-az-ink/30 mb-2 px-3">Universes</p>
                <div className="space-y-0.5 mb-2">
                  {UNIVERSE_OPTIONS.map((u) => {
                    const active = isActive(u.href);
                    return (
                      <Link
                        key={u.key}
                        href={u.href}
                        prefetch={true}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`${MOBILE_UNIVERSE_ROW_CLS} ${
                          active ? MOBILE_ROW_ACTIVE_CLS : MOBILE_ROW_IDLE_CLS
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            active ? ACTIVE_DOT_CLS : IDLE_DOT_CLS
                          }`}
                        />
                        {u.label}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            <div className="my-4 h-px bg-az-ink/[0.06]" />

            {/* Wallet (mobile, authenticated only) */}
            {isAuthenticated && (
              <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
                <span className="text-sm text-az-flame font-semibold">
                  {formatBalance(balance?.balance ?? 0)}
                </span>
              </div>
            )}

            {/* Auth actions */}
            {!isAuthenticated && (
              <div className="space-y-2 mt-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2.5 rounded-full text-sm font-medium text-az-ink/60 border border-az-ink/[0.1] transition-colors hover:text-az-ink"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block w-full text-center px-4 py-2.5 rounded-full text-sm font-semibold text-az-ink transition-all ${CTA_CLS}`}
                >
                  Sign up
                </Link>
              </div>
            )}
            {isAuthenticated && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2.5 rounded-full text-sm font-medium text-az-error-400 border border-az-error-500/20 hover:bg-az-error-500/10 transition-colors text-center"
              >
                {t('auth.logout')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spacer so page content doesn't hide behind fixed header */}
      <div className={scrolled ? HEADER_BAR_HEIGHT_SCROLLED_CLS : HEADER_BAR_HEIGHT_CLS} />
    </>
  );
}
