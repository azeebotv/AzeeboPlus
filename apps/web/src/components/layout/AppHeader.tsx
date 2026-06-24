'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../auth/BrandLogo';
import UniverseDropdown from './UniverseDropdown';

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Browse', href: '/browse', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { label: 'Library', href: '/library', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
] as const;

const USER_MENU_ITEMS = [
  { label: 'Profile', href: '/profile/edit', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { label: 'Settings', href: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Wallet', href: '/wallet', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Rewards', href: '/rewards', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.882A2.882 2.882 0 109.118 3H12m0 5.118V7m0 1.118L10.118 5.882M12 7l1.882-1.118M12 7l-1.882-1.118M12 13l2-2m-2 2l-2-2' },
] as const;

const CREATOR_MENU_ITEM = {
  label: 'Creators',
  href: '/creators',
  icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
};

export default function AppHeader({ active }: { active?: string }): React.JSX.Element {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isCreator = user?.role === 'creator' || user?.role === 'CREATOR';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (userMenuOpen || notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen, notifOpen]);

  const handleMobileMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        hamburgerRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusableEls = mobileMenuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button, input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableEls || focusableEls.length === 0) return;

      const firstEl = focusableEls[0];
      const lastEl = focusableEls[focusableEls.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    },
    []
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const isActive = (href: string) => {
    if (active) {
      const navItem = NAV_ITEMS.find((item) => item.label === active);
      if (navItem) return navItem.href === href;
    }
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 transition-all duration-500"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: scrolled
            ? 'rgba(13,59,46,0.95)'
            : 'rgba(13,59,46,0.6)',
          borderBottom: scrolled
            ? '1px solid rgba(232,66,10,0.15)'
            : '1px solid rgba(255,255,255,0.06)',
          boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
        }}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D3B2E] rounded-lg transition-transform hover:scale-105"
              aria-label="Azeebo+ Home"
            >
              <BrandLogo variant="orange" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => {
                const activeItem = isActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`
                      relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                      ${activeItem
                        ? 'text-white bg-white/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                      }
                    `}
                    aria-current={activeItem ? 'page' : undefined}
                  >
                    {item.label}
                    {activeItem && (
                      <span
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full transition-all duration-300"
                        style={{ background: 'linear-gradient(90deg, #E8420A, #CC1C1C)' }}
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Universe Selector (desktop) */}
            <div className="hidden md:block">
              <UniverseDropdown compact />
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-2">
              {/* Search Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A]"
                aria-label={searchOpen ? 'Close search' : 'Open search'}
                aria-expanded={searchOpen}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Notifications */}
              {isAuthenticated && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A]"
                    aria-label="Notifications"
                    aria-expanded={notifOpen}
                    aria-haspopup="true"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                      style={{ background: '#E8420A', boxShadow: '0 0 8px rgba(232,66,10,0.6)' }}
                      aria-hidden="true"
                    />
                  </button>

                  {notifOpen && (
                    <div
                      className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 shadow-2xl py-2 z-50 max-h-96 overflow-y-auto"
                      style={{
                        background: 'rgba(13,59,46,0.98)',
                        backdropFilter: 'blur(24px)',
                      }}
                      role="menu"
                      aria-label="Notifications"
                    >
                      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">Notifications</p>
                        <Link
                          href="/notifications"
                          onClick={() => setNotifOpen(false)}
                          className="text-xs text-[#E8420A] hover:text-[#FF5500] transition-colors"
                        >
                          View all
                        </Link>
                      </div>
                      <div className="px-4 py-6 text-center">
                        <svg className="w-10 h-10 mx-auto text-white/20 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-sm text-white/40">No new notifications</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-white/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A]"
                    aria-label="User menu"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <div
                      className="rounded-full flex items-center justify-center font-bold text-white text-sm ring-2 ring-white/10"
                      style={{
                        width: 36,
                        height: 36,
                        background: 'linear-gradient(135deg, #E8420A, #CC1C1C)',
                      }}
                    >
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <svg
                      className={`w-4 h-4 text-white/50 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/10 shadow-2xl py-2 z-50 overflow-hidden"
                      style={{
                        background: 'rgba(13,59,46,0.98)',
                        backdropFilter: 'blur(24px)',
                      }}
                      role="menu"
                      aria-label="User options"
                    >
                      <div
                        className="px-4 py-3 border-b border-white/10"
                        style={{ background: 'linear-gradient(135deg, rgba(232,66,10,0.08), rgba(204,28,28,0.04))' }}
                      >
                        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-white/40 truncate">{user?.email || 'Member'}</p>
                      </div>

                      <div className="py-1">
                        {USER_MENU_ITEMS.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                            role="menuitem"
                          >
                            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                            </svg>
                            {item.label}
                          </Link>
                        ))}
                        {isCreator && (
                          <Link
                            href={CREATOR_MENU_ITEM.href}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                            role="menuitem"
                          >
                            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={CREATOR_MENU_ITEM.icon} />
                            </svg>
                            {CREATOR_MENU_ITEM.label}
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-white/10 pt-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          role="menuitem"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="px-4 py-1.5 rounded-full text-sm font-medium text-white/70 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link href="/auth/register">
                    <button
                      type="button"
                      className="px-5 py-1.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #E8420A, #CC1C1C)',
                        boxShadow: '0 4px 14px rgba(232,66,10,0.25)',
                      }}
                    >
                      Get Started
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-1">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label={searchOpen ? 'Close search' : 'Open search'}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <button
                ref={hamburgerRef}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A]"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <div className="w-5 h-5 flex flex-col justify-center gap-1">
                  <span
                    className={`block h-0.5 w-5 rounded-full bg-current transition-all duration-300 origin-center ${mobileMenuOpen ? 'rotate-45 translate-y-[3px]' : ''}`}
                  />
                  <span
                    className={`block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-0' : ''}`}
                  />
                  <span
                    className={`block h-0.5 w-5 rounded-full bg-current transition-all duration-300 origin-center ${mobileMenuOpen ? '-rotate-45 -translate-y-[3px]' : ''}`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Search Bar */}
        <div
          className={`overflow-hidden transition-all duration-300 ${searchOpen ? 'max-h-20' : 'max-h-0'}`}
          style={{ background: 'rgba(13,59,46,0.95)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <form onSubmit={handleSearchSubmit} role="search" aria-label="Site search">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search content, creators, shows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-12 py-2.5 rounded-full text-sm text-white placeholder-white/30 bg-white/5 border border-white/10 focus:border-[#E8420A]/50 focus:bg-white/10 outline-none transition-all"
                  aria-label="Search Azeebo+"
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close search"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        <div
          ref={mobileMenuRef}
          id="mobile-menu"
          className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] flex flex-col transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{
            background: 'rgba(13,59,46,0.98)',
            backdropFilter: 'blur(24px)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          onKeyDown={handleMobileMenuKeyDown}
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <BrandLogo variant="orange" />
            <button
              onClick={() => { setMobileMenuOpen(false); hamburgerRef.current?.focus(); }}
              className="p-2 -mr-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A]"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile navigation">
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const activeItem = isActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${activeItem ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    aria-current={activeItem ? 'page' : undefined}
                    style={activeItem ? { background: 'linear-gradient(135deg, rgba(232,66,10,0.2), rgba(204,28,28,0.1))' } : {}}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 mb-2 px-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-3">Universe</p>
              <UniverseDropdown />
            </div>

            {isAuthenticated && (
              <>
                <div className="mt-6 mb-2 px-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">Account</p>
                </div>
                <div className="space-y-1">
                  {USER_MENU_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
                    >
                      <svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                      {item.label}
                    </Link>
                  ))}
                  {isCreator && (
                    <Link
                      href={CREATOR_MENU_ITEM.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
                    >
                      <svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={CREATOR_MENU_ITEM.icon} />
                      </svg>
                      {CREATOR_MENU_ITEM.label}
                    </Link>
                  )}
                </div>
              </>
            )}
          </nav>

          {/* Mobile Menu Footer */}
          <div className="px-5 py-4 border-t border-white/10">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ring-2 ring-white/10"
                    style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-white/40 truncate">{user?.email || 'Member'}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setMobileMenuOpen(false); logout(); }}
                  className="w-full px-4 py-2.5 rounded-full text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-center"
                  style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/auth/login"
                  className="block w-full px-4 py-2.5 rounded-full text-sm font-medium text-center text-white/70 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  Sign In
                </Link>
                <Link href="/auth/register" className="block w-full">
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 rounded-full text-sm font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                  >
                    Get Started
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
