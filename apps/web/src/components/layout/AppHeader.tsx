'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import BrandLogo from '../auth/BrandLogo';

/* ─── Constants ─── */

const NAV_LINKS = [
  { label: 'Home', href: '/home' },
  { label: 'Browse', href: '/browse' },
  { label: 'Library', href: '/library' },
];

const UNIVERSE_OPTIONS = [
  { key: 'reality', label: 'Reality', href: '/reality' },
  { key: 'creators', label: 'Creators', href: '/creators' },
  { key: 'lifestyle', label: 'Lifestyle', href: '/lifestyle' },
  { key: 'vertical', label: 'Vertical', href: '/vertical' },
  { key: 'movies', label: 'Movies', href: '/movies' },
  { key: 'games', label: 'Games', href: '/games' },
  { key: 'comedy', label: 'Comedy', href: '/comedy' },
  { key: 'sports', label: 'Sports', href: '/sports' },
] as const;

const PROFILE_MENU_ITEMS: {
  label: string;
  href: string;
  icon: 'user' | 'star' | 'wallet' | 'creator' | 'settings';
  creatorOnly?: boolean;
}[] = [
  { label: 'Profile', href: '/profile', icon: 'user' },
  { label: 'Rewards', href: '/rewards', icon: 'star' },
  { label: 'Wallet', href: '/wallet', icon: 'wallet' },
  { label: 'Creator Dashboard', href: '/creators/dashboard', icon: 'creator', creatorOnly: true },
  { label: 'Settings', href: '/settings', icon: 'settings' },
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

function formatBalance(amount: number): string {
  if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `₦${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`;
  return `₦${amount.toLocaleString()}`;
}

/* ─── Profile menu icon component ─── */
function MenuIcon({ type }: { type: 'user' | 'star' | 'wallet' | 'creator' | 'settings' }) {
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
  }
}

/* ─── AppHeader ─── */

export default function AppHeader({ active: _active }: { active?: string }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { balance } = useWallet();
  const pathname = usePathname();
  const router = useRouter();
  const isCreator = user?.role?.toLowerCase() === 'creator';

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
        className="fixed top-0 left-0 right-0 z-[100] transition-all duration-500"
        style={{
          backdropFilter: 'blur(18px) saturate(180%)',
          WebkitBackdropFilter: 'blur(18px) saturate(180%)',
          background: scrolled ? 'rgba(9,9,15,0.92)' : 'rgba(9,9,15,0.75)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          borderBottom: `1px solid rgba(255,255,255,${scrolled ? '0.1' : '0.06'})`,
          boxShadow: `0 1px ${scrolled ? '24px' : '12px'} rgba(0,0,0,${scrolled ? '0.4' : '0.2'})`,
        }}
        role="banner"
      >
        {/* ═══ Main Header Bar ═══ */}
        <div className="relative max-w-[1280px] mx-auto" style={{ height: scrolled ? 56 : 68 }}>
          {/* ─── 1. Brand Logo — pinned left ─── */}
          <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-10">
            <Link
              href="/"
              className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090F] rounded-lg transition-transform hover:scale-105"
              aria-label="Azeebo+ home"
            >
              <BrandLogo variant="orange" />
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
                        className="relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
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
                        {link.label}
                        {active && (
                          <span
                            className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                            style={{ background: '#E8420A' }}
                          />
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* Divider */}
                <span className="w-px h-4 bg-white/10 mx-1" aria-hidden="true" />

                {/* Universes Dropdown */}
                <div className="relative" ref={universeDropdownRef}>
                  <button
                    onClick={() => setUniversesOpen((v) => !v)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      color: universesOpen ? '#fff' : 'rgba(255,255,255,0.55)',
                      background: universesOpen ? 'rgba(232,74,95,0.14)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                    }}
                    onMouseLeave={(e) => {
                      if (!universesOpen) e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                    }}
                    aria-label="Browse universes"
                    aria-expanded={universesOpen}
                    aria-haspopup="true"
                  >
                    Universes
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
                      className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 rounded-2xl border border-white/[0.08] shadow-2xl py-1.5 z-50"
                      style={{ background: 'rgba(9,9,15,0.97)', backdropFilter: 'blur(24px)' }}
                      role="menu"
                      aria-label="Universes"
                    >
                      {UNIVERSE_OPTIONS.map((u) => {
                        const active = isActive(u.href);
                        return (
                          <Link
                            key={u.key}
                            href={u.href}
                            prefetch={true}
                            onClick={() => setUniversesOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors"
                            style={{
                              color: active ? '#E8420A' : 'rgba(255,255,255,0.6)',
                              background: active ? 'rgba(232,74,95,0.1)' : 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              if (!active) {
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!active) {
                                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                            role="menuitem"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: active ? '#E8420A' : 'transparent' }}
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
                  className="p-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.06] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A]"
                  aria-label="Search"
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

                {/* Wallet balance — desktop only */}
                <div
                  className="hidden sm:flex items-center gap-0 px-3 py-1.5 rounded-full text-xs font-medium border border-white/[0.06]"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <span className="text-[#E8420A] font-semibold whitespace-nowrap">
                    {formatBalance(balance?.balance ?? 0)}
                  </span>
                </div>

                {/* Profile icon with dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center justify-center w-9 h-9 rounded-full text-white text-xs font-bold transition-all hover:ring-2 hover:ring-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A]"
                    style={{ background: seededGradient(user?.id || 'default') }}
                    aria-label="Profile menu"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                  >
                    {getInitials(user?.displayName || user?.name)}
                  </button>

                  {profileOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/[0.08] shadow-2xl py-1.5 z-50 overflow-hidden"
                      style={{ background: 'rgba(9,9,15,0.97)', backdropFilter: 'blur(24px)' }}
                      role="menu"
                      aria-label="User menu"
                    >
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-white/[0.06]">
                        <p className="text-sm font-semibold text-white truncate">
                          {user?.displayName || user?.name}
                        </p>
                        <p className="text-xs text-white/40 truncate">{user?.email}</p>
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
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                              role="menuitem"
                            >
                              <MenuIcon type={item.icon} />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>

                      {/* Log out */}
                      <div className="border-t border-white/[0.06] pt-1">
                        {!confirmLogout ? (
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
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
                            Sign out
                          </button>
                        ) : (
                          <div className="px-4 py-2">
                            <p className="text-xs text-white/50 mb-2">Are you sure?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={handleLogout}
                                className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                              >
                                Yes, sign out
                              </button>
                              <button
                                onClick={() => setConfirmLogout(false)}
                                className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 border border-white/[0.1] hover:text-white transition-colors"
                              >
                                Cancel
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
                  className="hidden sm:inline-flex px-4 py-1.5 rounded-full text-sm font-medium text-white/60 hover:text-white transition-colors border border-white/[0.1]"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-1.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #E8420A, #CC1C1C)',
                    boxShadow: '0 4px 14px rgba(232,66,10,0.25)',
                  }}
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* ─── Hamburger — mobile only ─── */}
            <button
              ref={hamburgerRef}
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A]"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
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
          className={`overflow-hidden transition-all duration-300 ${searchOpen ? 'max-h-[120px]' : 'max-h-0'}`}
          style={{
            background: 'rgba(9,9,15,0.98)',
            borderTop: searchOpen ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}
          role="search"
          aria-label="Site search"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30"
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
            {/* Search in mobile */}
            <form onSubmit={handleSearchSubmit} className="mb-4">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
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
                  placeholder="Search…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm text-white placeholder-white/30 bg-white/[0.04] border border-white/[0.08] outline-none"
                  aria-label="Search Azeebo+"
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
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                        background: active ? 'rgba(232,74,95,0.14)' : 'transparent',
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: active ? '#E8420A' : 'transparent' }}
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
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2 px-3">
                  Universes
                </p>
                <div className="space-y-0.5 mb-2">
                  {UNIVERSE_OPTIONS.map((u) => {
                    const active = isActive(u.href);
                    return (
                      <Link
                        key={u.key}
                        href={u.href}
                        prefetch={true}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                          background: active ? 'rgba(232,74,95,0.14)' : 'transparent',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: active ? '#E8420A' : 'transparent' }}
                        />
                        {u.label}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            <div className="my-4 h-px bg-white/[0.06]" />

            {/* Wallet (mobile, authenticated only) */}
            {isAuthenticated && (
              <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
                <span className="text-sm text-[#E8420A] font-semibold">
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
                  className="block w-full text-center px-4 py-2.5 rounded-full text-sm font-medium text-white/60 border border-white/[0.1] transition-colors hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2.5 rounded-full text-sm font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
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
                className="w-full px-4 py-2.5 rounded-full text-sm font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors text-center"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spacer so page content doesn't hide behind fixed header */}
      <div style={{ height: scrolled ? 56 : 68 }} />
    </>
  );
}
