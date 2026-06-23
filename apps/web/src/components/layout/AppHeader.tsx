'use client';
import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../auth/BrandLogo';
import { ThemeToggle } from '../ThemeToggle';

const NAV_ITEMS = ['Home', 'Browse', 'Library', 'Creators'] as const;

export default function AppHeader({ active }: { active?: string }): React.JSX.Element {
  const { user, isAuthenticated, logout } = useAuth();

  return (
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

        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const href = item === 'Home' ? '/' : `/${item.toLowerCase()}`;
            const isActive = active === item;
            return (
              <Link
                key={item}
                href={href}
                className={`text-base font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-white/70 hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item}
              </Link>
            );
          })}
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
                <span className="text-sm font-medium text-white hidden sm:block">{user?.name}</span>
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
  );
}
