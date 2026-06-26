'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../auth/BrandLogo';
import { apiFetch } from '../../lib/api/base';

/* ─── Constants ─── */

const UNIVERSE_TABS = [
  { key: 'reality', label: 'Reality', href: '/universe/reality', hasLive: true },
  { key: 'creators', label: 'Creators', href: '/universe/creators' },
  { key: 'lifestyle', label: 'Lifestyle', href: '/universe/lifestyle' },
  { key: 'vertical', label: 'Vertical', href: '/universe/vertical' },
  { key: 'movies', label: 'Movies', href: '/universe/movies' },
  { key: 'games', label: 'Games', href: '/universe/games' },
  { key: 'comedy', label: 'Comedy', href: '/universe/comedy' },
  { key: 'sports', label: 'Sports', href: '/universe/sports' },
] as const;

const SEARCH_UNIVERSE_FILTERS = ['All', 'Reality', 'Creators', 'Movies', 'Games', 'Sports'] as const;

const TRENDING_SEARCHES = [
  'BBNaija All Stars',
  'Nollywood movies',
  'Lagos comedy',
  'Afrobeats concert',
  'Big Brother',
  'Naija football',
];

const AVATAR_MENU_ITEMS = [
  { label: 'Profile', href: '/profile' },
  { label: 'Wallet', href: '/wallet' },
  { label: 'Rewards', href: '/rewards' },
  { label: 'Creator tools', href: '/creators', role: 'creator' as const },
  { label: 'Settings', href: '/settings' },
];

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

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0m';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/* ─── AppHeader ─── */

export default function AppHeader({ active }: { active?: string }) {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const isCreator = user?.role === 'creator' || user?.role === 'CREATOR';

  // Global state
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('All');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Live ticker
  const [liveEvent, setLiveEvent] = useState<{ title: string; endsAt: string; href: string } | null>(null);
  const [tickerDismissed, setTickerDismissed] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [isRealityLive, setIsRealityLive] = useState(false);

  // Notifications
  const [unreadCount, setUnreadCount] = useState(0);

  // Search results
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchOverlayRef = useRef<HTMLDivElement>(null);
  const universeNavRef = useRef<HTMLDivElement>(null);
  const [activeTabIndicator, setActiveTabIndicator] = useState<{ left: number; width: number } | null>(null);

  /* ─── Scroll Effect ─── */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ─── Body scroll lock ─── */
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  /* ─── Close menus on route change ─── */
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  /* ─── Keyboard: Esc closes overlays ─── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (searchOpen) { setSearchOpen(false); return; }
        if (mobileMenuOpen) { setMobileMenuOpen(false); hamburgerRef.current?.focus(); return; }
        if (userMenuOpen) setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, mobileMenuOpen, userMenuOpen]);

  /* ─── Click outside for dropdowns ─── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    if (userMenuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  /* ─── Fetch live event ─── */
  useEffect(() => {
    let cancelled = false;
    const fetchLive = async () => {
      try {
        const res = await apiFetch<any>('/reality/live');
        if (!cancelled && res?.success && res.data) {
          const ev = res.data;
          setLiveEvent({
            title: ev.title || ev.name || 'Live Event',
            endsAt: ev.endsAt || ev.endDate || '',
            href: ev.href || ev.url || '/universe/reality',
          });
          setIsRealityLive(true);
        }
      } catch {
        // no live event — silent
      }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  /* ─── Countdown timer ─── */
  useEffect(() => {
    if (!liveEvent?.endsAt) return;
    const tick = () => {
      const diff = new Date(liveEvent.endsAt).getTime() - Date.now();
      setCountdown(formatCountdown(diff));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [liveEvent?.endsAt]);

  /* ─── Fetch unread notifications count ─── */
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await apiFetch<any>('/notifications/unread-count');
        if (!cancelled && res?.success) setUnreadCount(res.data?.count ?? 0);
      } catch { /* silent */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isAuthenticated]);

  /* ─── Load recent searches from localStorage ─── */
  useEffect(() => {
    try {
      const stored = localStorage.getItem('azeebo_recent_searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch { /* silent */ }
  }, []);

  /* ─── Search input auto-focus ─── */
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  /* ─── Search debounce ─── */
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: searchQuery.trim(), limit: '8' });
        if (searchFilter !== 'All') params.set('universe', searchFilter.toLowerCase());
        const res = await apiFetch<any>(`/search?${params}`);
        if (res?.success) setSearchResults(res.data?.results ?? []);
      } catch { setSearchResults([]); }
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchFilter]);

  /* ─── Ticker dismissed state from sessionStorage ─── */
  useEffect(() => {
    setTickerDismissed(sessionStorage.getItem('ticker_dismissed') === '1');
  }, []);

  const dismissTicker = useCallback(() => {
    setTickerDismissed(true);
    sessionStorage.setItem('ticker_dismissed', '1');
  }, []);

  /* ─── Universe tab underline indicator ─── */
  const updateTabIndicator = useCallback(() => {
    if (!universeNavRef.current) return;
    const activeEl = universeNavRef.current.querySelector('[data-tab-active="true"]') as HTMLElement | null;
    if (activeEl) {
      const navRect = universeNavRef.current.getBoundingClientRect();
      const tabRect = activeEl.getBoundingClientRect();
      setActiveTabIndicator({ left: tabRect.left - navRect.left, width: tabRect.width });
    } else {
      setActiveTabIndicator(null);
    }
  }, [pathname]);

  useEffect(() => {
    updateTabIndicator();
    window.addEventListener('resize', updateTabIndicator);
    return () => window.removeEventListener('resize', updateTabIndicator);
  }, [updateTabIndicator, pathname]);

  /* ─── Search submit ─── */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    // Save to recent searches
    const next = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5);
    setRecentSearches(next);
    localStorage.setItem('azeebo_recent_searches', JSON.stringify(next));
    window.location.href = `/search?q=${encodeURIComponent(q)}`;
  };

  /* ─── Check if a universe tab is active ─── */
  const isTabActive = (href: string) => pathname.startsWith(href);

  /* ─── Ticker: show only when live + not dismissed ─── */
  const showTicker = !!liveEvent && !tickerDismissed;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-[100] transition-all duration-500"
        style={{
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          background: scrolled ? 'rgba(9,9,15,0.96)' : 'rgba(9,9,15,0.82)',
          borderBottom: `1px solid rgba(255,255,255,${scrolled ? '0.1' : '0.07'})`,
        }}
        role="banner"
      >
        {/* ═══ Layer 1 — Live Event Ticker Strip ═══ */}
        {showTicker && (
          <div
            className="relative overflow-hidden transition-all duration-500"
            style={{
              background: 'rgba(232,74,95,0.08)',
              borderLeft: '3px solid #E8420A',
            }}
          >
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center justify-between h-9 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex-shrink-0">
                  <span
                    className="block w-2 h-2 rounded-full"
                    style={{ background: '#E8420A' }}
                  />
                  <span
                    className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                    style={{ background: '#E8420A' }}
                  />
                </span>
                <span className="text-xs text-white/70 truncate">
                  <span className="text-white font-medium">{liveEvent.title}</span>
                  {' '}voting closes in{' '}
                  <span className="font-mono font-semibold text-white">{countdown}</span>
                </span>
                <Link
                  href={liveEvent.href}
                  className="hidden sm:inline-flex flex-shrink-0 items-center px-3 py-1 rounded-full text-[11px] font-bold text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                >
                  Vote now
                </Link>
              </div>
              <button
                onClick={dismissTicker}
                className="flex-shrink-0 p-1 rounded text-white/30 hover:text-white/70 transition-colors"
                aria-label="Dismiss live event ticker"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ═══ Layer 2 — Main Header Bar ═══ */}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-6 flex items-center justify-between gap-4" style={{ height: scrolled ? 56 : 68 }}>
          {/* Zone A — Logo */}
          <Link
            href="/"
            className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090F] rounded-lg transition-transform hover:scale-105"
            aria-label="Azeebo+ home"
          >
            <BrandLogo variant="orange" />
          </Link>

          {/* Zone B — Universe Navigation (Desktop only) */}
          <nav
            ref={universeNavRef}
            className="hidden lg:flex items-center gap-0.5 relative overflow-x-auto scrollbar-none"
            aria-label="Universe navigation"
            style={{ scrollbarWidth: 'none' }}
          >
            {UNIVERSE_TABS.map((tab) => {
              const active = isTabActive(tab.href);
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  data-tab-active={active ? 'true' : undefined}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all duration-200"
                  style={{
                    color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                    background: active ? 'rgba(232,74,95,0.14)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                  }}
                >
                  {/* Red dot prefix */}
                  <span
                    className="w-[5px] h-[5px] rounded-full flex-shrink-0 transition-opacity duration-200"
                    style={{
                      background: '#E8420A',
                      opacity: active ? 1 : 0,
                    }}
                  />
                  {tab.label}
                  {/* Live badge for Reality */}
                  {tab.hasLive && isRealityLive && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white"
                      style={{ background: '#E8420A' }}
                      aria-label="Live now"
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                      </span>
                      Live
                    </span>
                  )}
                </Link>
              );
            })}
            {/* Sliding underline indicator */}
            {activeTabIndicator && (
              <span
                className="absolute bottom-0 h-[2px] rounded-full transition-all duration-300"
                style={{
                  left: activeTabIndicator.left,
                  width: activeTabIndicator.width,
                  background: '#E8420A',
                }}
              />
            )}
          </nav>

          {/* Zone C — Right Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="p-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.06] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A]"
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {isAuthenticated ? (
              <>
                {/* Wallet chip — desktop only */}
                <div className="hidden lg:flex items-center gap-0 px-3 py-1.5 rounded-full text-xs font-medium border border-white/[0.06]"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <span className="text-[#E8420A] font-semibold">₦{(user as any)?.balance ?? '0'}</span>
                  <span className="mx-1.5 w-px h-3 bg-white/10" aria-hidden="true" />
                  <span className="text-yellow-500 font-semibold">0 pts</span>
                  <Link
                    href="/wallet/topup"
                    className="ml-1 flex items-center justify-center w-5 h-5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Top up wallet"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </Link>
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button
                    className="relative p-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.06] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A]"
                    aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                    onClick={() => window.location.href = '/notifications'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span
                        className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full"
                        style={{ background: '#E8420A', boxShadow: '0 0 6px rgba(232,66,10,0.6)' }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>

                {/* Avatar button */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center justify-center w-9 h-9 rounded-full text-white text-xs font-bold transition-all hover:ring-2 hover:ring-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A]"
                    style={{ background: seededGradient(user?.id || 'default') }}
                    aria-label="User menu"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    {getInitials(user?.displayName || user?.name)}
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/[0.08] shadow-2xl py-1.5 z-50 overflow-hidden"
                      style={{ background: 'rgba(9,9,15,0.97)', backdropFilter: 'blur(24px)' }}
                      role="menu"
                      aria-label="User options"
                    >
                      <div className="px-4 py-3 border-b border-white/[0.06]">
                        <p className="text-sm font-semibold text-white truncate">{user?.displayName || user?.name}</p>
                        <p className="text-xs text-white/40 truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        {AVATAR_MENU_ITEMS.map((item) => {
                          if (item.role && !isCreator) return null;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setUserMenuOpen(false)}
                              className="block px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                              role="menuitem"
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                      <div className="border-t border-white/[0.06] pt-1">
                        <button
                          onClick={() => { setUserMenuOpen(false); logout(); }}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          role="menuitem"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Logged-out: Sign in + Join free */
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="hidden sm:inline-flex px-4 py-1.5 rounded-full text-sm font-medium text-white/60 hover:text-white transition-colors border border-white/[0.1]"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-1.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #E8420A, #CC1C1C)',
                    boxShadow: '0 4px 14px rgba(232,66,10,0.25)',
                  }}
                >
                  Join free
                </Link>
              </div>
            )}

            {/* Hamburger — mobile only */}
            <button
              ref={hamburgerRef}
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A]"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-drawer"
            >
              <div className="w-5 h-5 flex flex-col justify-center gap-[5px]">
                <span className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 origin-center ${mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                <span className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-0' : ''}`} />
                <span className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 origin-center ${mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* ═══ Layer 3 — Search Overlay ═══ */}
        <div
          ref={searchOverlayRef}
          className={`overflow-hidden transition-all duration-300 ${searchOpen ? 'max-h-[420px]' : 'max-h-0'}`}
          style={{ background: 'rgba(9,9,15,0.98)', borderTop: searchOpen ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
          role="search"
          aria-label="Site search"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4">
            {/* Search input */}
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search shows, creators, movies…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 rounded-full text-sm text-white placeholder-white/30 bg-white/[0.04] border border-white/[0.08] focus:border-[#E8420A]/50 focus:bg-white/[0.07] outline-none transition-all"
                  aria-label="Search Azeebo+"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </form>

            {/* Universe filter pills */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
              {SEARCH_UNIVERSE_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setSearchFilter(f)}
                  className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200"
                  style={{
                    background: searchFilter === f ? 'rgba(232,74,95,0.18)' : 'rgba(255,255,255,0.04)',
                    color: searchFilter === f ? '#E8420A' : 'rgba(255,255,255,0.5)',
                    border: `1px solid ${searchFilter === f ? 'rgba(232,74,95,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Content area: trending / recent / results */}
            <div className="mt-4 max-h-[280px] overflow-y-auto">
              {/* Quick results */}
              {searchQuery.trim().length >= 2 && (
                <div>
                  {searchLoading ? (
                    <div className="py-6 text-center">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-[#E8420A] rounded-full animate-spin mx-auto" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((r: any, i: number) => (
                        <Link
                          key={i}
                          href={r.href || r.url || `/watch/${r.id}`}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {r.thumbnail ? (
                              <img src={r.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate">{r.title || r.name}</p>
                            <p className="text-xs text-white/40">{r.type || r.universe || 'Content'}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-sm text-white/30">No results found</p>
                  )}
                </div>
              )}

              {/* Trending searches */}
              {!searchQuery.trim() && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2 px-1">Trending</p>
                  <div className="space-y-0.5">
                    {TRENDING_SEARCHES.map((q) => (
                      <button
                        key={q}
                        onClick={() => { setSearchQuery(q); }}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-left text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                      >
                        <svg className="w-4 h-4 text-white/20 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent searches (logged-in only) */}
              {!searchQuery.trim() && isAuthenticated && recentSearches.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2 px-1">Recent</p>
                  <div className="space-y-0.5">
                    {recentSearches.map((q) => (
                      <button
                        key={q}
                        onClick={() => setSearchQuery(q)}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-left text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                      >
                        <svg className="w-4 h-4 text-white/20 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
          onClick={() => { setMobileMenuOpen(false); hamburgerRef.current?.focus(); }}
        />

        {/* Drawer panel */}
        <div
          ref={drawerRef}
          id="mobile-drawer"
          className={`absolute top-0 left-0 right-0 transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}
          style={{
            background: 'rgba(9,9,15,0.97)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4">
            {/* Universe links */}
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-3">Universe</p>
            <div className="space-y-0.5">
              {UNIVERSE_TABS.map((tab) => {
                const active = isTabActive(tab.href);
                return (
                  <Link
                    key={tab.key}
                    href={tab.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                      background: active ? 'rgba(232,74,95,0.14)' : 'transparent',
                    }}
                  >
                    <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: active ? '#E8420A' : 'transparent' }} />
                    {tab.label}
                    {tab.hasLive && isRealityLive && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white"
                        style={{ background: '#E8420A' }}
                        aria-label="Live now"
                      >
                        Live
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="my-4 h-px bg-white/[0.06]" />

            {/* Wallet summary (logged-in only) */}
            {isAuthenticated && (
              <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
                <span className="text-sm text-[#E8420A] font-semibold">₦{(user as any)?.balance ?? '0'}</span>
                <span className="w-px h-4 bg-white/10" />
                <span className="text-sm text-yellow-500 font-semibold">0 pts</span>
              </div>
            )}

            {/* Auth actions */}
            {!isAuthenticated && (
              <div className="space-y-2 mt-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2.5 rounded-full text-sm font-medium text-white/60 border border-white/[0.1] transition-colors hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2.5 rounded-full text-sm font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                >
                  Join free
                </Link>
              </div>
            )}
            {isAuthenticated && (
              <button
                onClick={() => { setMobileMenuOpen(false); logout(); }}
                className="w-full px-4 py-2.5 rounded-full text-sm font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors text-center"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spacer so page content doesn't hide behind fixed header */}
      <div style={{ height: showTicker ? (scrolled ? 105 : 117) : (scrolled ? 56 : 68) }} />
    </>
  );
}
