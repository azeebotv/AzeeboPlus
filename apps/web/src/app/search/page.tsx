'use client';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Skeleton, Avatar } from '@azeebo/ui';
import { colors } from '@azeebo/design-tokens';
import Link from 'next/link';
import { apiFetch, ContentItem, PaginatedResponse } from '@/lib/api';
import { webLogger } from '@/lib/logger';

const categories = ['All', 'Movies', 'Series', 'Creators', 'Games', 'Sports'];

export default function SearchPage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContentItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setError(null);

    try {
      const params = new URLSearchParams({ q: query });
      if (activeCategory !== 'All') {
        params.append('category', activeCategory.toLowerCase());
      }
      const result = await apiFetch<PaginatedResponse<ContentItem>>(`/v1/content/search?${params.toString()}`);

      if (result.success && result.data) {
        setResults(result.data.items || []);
      } else {
        setResults([]);
      }
    } catch (err) {
      webLogger.error('Search failed', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1 className="text-2xl font-bold hidden sm:block" style={{ color: colors.text.primary }}>Azeebo+</h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Browse', 'Library', 'Creators', 'Search'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : item === 'Search' ? '/search' : `/${item.toLowerCase()}`}
                className="text-base font-medium transition-colors"
                style={{ color: item === 'Search' ? colors.primary[500] : colors.text.secondary }}
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar size="md" fallback={user?.name?.charAt(0) || 'U'} />
                  <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{user?.name}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for movies, series, creators, games..."
              className="w-full px-6 py-4 text-lg rounded-full border-2 focus:outline-none transition-colors"
              style={{ backgroundColor: colors.bg.secondary, borderColor: colors.border.light, color: colors.text.primary }}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 rounded-full font-semibold transition-colors"
              style={{ backgroundColor: colors.primary[500], color: 'white' }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Categories */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className="px-5 py-2 rounded-full font-medium whitespace-nowrap transition-all"
              style={{ backgroundColor: activeCategory === category ? colors.primary[500] : colors.bg.tertiary, color: activeCategory === category ? 'white' : colors.text.secondary }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search Results or Initial State */}
        {!hasSearched ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: colors.text.secondary }}>
              Start typing to search for content
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Loading State */}
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i}>
                    <Skeleton height="24px" width="150px" className="mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3].map(j => (
                        <Skeleton key={j} height="200px" className="rounded-lg" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-lg mb-4" style={{ color: colors.text.secondary }}>{error}</p>
                <Button variant="primary" onClick={handleSearch as React.MouseEventHandler<HTMLButtonElement>}>Retry</Button>
              </div>
            ) : results.length > 0 ? (
              <div>
                <h3 className="text-xl font-bold mb-4" style={{ color: colors.text.primary }}>Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((item) => (
                    <Card key={item.id} padding="none" className="overflow-hidden cursor-pointer">
                      <img src={item.thumbnail} alt={item.title} className="w-full h-40 object-cover" />
                      <div className="p-4">
                        <h4 className="font-bold" style={{ color: colors.text.primary }}>{item.title}</h4>
                        <p className="text-sm" style={{ color: colors.text.secondary }}>{item.description}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg" style={{ color: colors.text.secondary }}>
                  No results found for &ldquo;{query}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t py-12" style={{ borderColor: colors.border.light, backgroundColor: colors.bg.secondary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Azeebo+</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['About', 'Careers', 'Press'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Help</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Support', 'FAQ', 'Contact'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Legal</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Terms', 'Privacy', 'Cookies'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Connect</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Twitter', 'Instagram', 'Facebook'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm" style={{ borderColor: colors.border.light, color: colors.text.tertiary }}>
            <p>© 2026 Azeebo+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
