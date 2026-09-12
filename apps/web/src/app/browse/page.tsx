'use client';
'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { ContentItem } from '../../lib/api';
import { announceToScreenReader } from '../../lib/keyboard';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import { OptimizedImage } from '../../components/OptimizedImage';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { EmptyState } from '../../components/ui/EmptyState';
import { Gamepad2, Trophy, Tv, Film, Sparkles } from 'lucide-react';

function getUniverseIcon(name: string): React.JSX.Element {
  const lower = name.toLowerCase();
  if (lower.includes('game')) return <Gamepad2 className="w-4 h-4 inline mr-2 text-amber-400" />;
  if (lower.includes('sport')) return <Trophy className="w-4 h-4 inline mr-2 text-emerald-400" />;
  if (lower.includes('reality') || lower.includes('show')) return <Tv className="w-4 h-4 inline mr-2 text-purple-400" />;
  if (lower.includes('movie') || lower.includes('film') || lower.includes('cinema')) return <Film className="w-4 h-4 inline mr-2 text-rose-400" />;
  return <Sparkles className="w-4 h-4 inline mr-2 text-orange-400" />;
}

interface ContentResponse {
  items?: ContentItem[];
}

export default function BrowsePage(): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('Popular');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [maxDuration, setMaxDuration] = useState<number>(300);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const categoryListRef = useRef<HTMLUListElement>(null);
  const universeListRef = useRef<HTMLUListElement>(null);
  const contentGridRef = useRef<HTMLDivElement>(null);

  const handleCategoryKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    const buttons = categoryListRef.current?.querySelectorAll('button');
    if (!buttons) return;
    let nextIndex = index;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      nextIndex = (index + 1) % buttons.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      nextIndex = (index - 1 + buttons.length) % buttons.length;
    } else if (event.key === 'Home') {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      nextIndex = buttons.length - 1;
    } else return;
    (buttons[nextIndex] as HTMLElement).focus();
  }, []);

  const handleUniverseKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    const buttons = universeListRef.current?.querySelectorAll('button');
    if (!buttons) return;
    let nextIndex = index;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      nextIndex = (index + 1) % buttons.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      nextIndex = (index - 1 + buttons.length) % buttons.length;
    } else if (event.key === 'Home') {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      nextIndex = buttons.length - 1;
    } else return;
    (buttons[nextIndex] as HTMLElement).focus();
  }, []);

  const handleContentKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    const cards = contentGridRef.current?.querySelectorAll('[role="article"]');
    if (!cards) return;
    const columns = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
    let nextIndex = index;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextIndex = Math.min(index + 1, cards.length - 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nextIndex = Math.max(index - 1, 0);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      nextIndex = Math.min(index + columns, cards.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      nextIndex = Math.max(index - columns, 0);
    } else return;
    const card = cards[nextIndex] as HTMLElement;
    card.focus();
    const title = card.querySelector('h4')?.textContent;
    if (title) announceToScreenReader(`Focused: ${title}`);
  }, []);

  const categoriesQuery = useQuery({
    queryKey: ['browse', 'categories'],
    queryFn: async () => {
      const response = await api.content.getCategories();
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    },
    staleTime: 300000,
  });

  const universesQuery = useQuery({
    queryKey: ['browse', 'universes'],
    queryFn: async () => {
      const response = await api.universe.getUniverses();
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    },
    staleTime: 300000,
  });

  const contentQuery = useQuery({
    queryKey: ['browse', 'content', selectedCategory, selectedUniverseId],
    queryFn: async () => {
      let response;
      if (selectedUniverseId) response = await api.content.getContentByUniverse(selectedUniverseId);
      else if (selectedCategory)
        response = await api.content.getContentByCategory(selectedCategory);
      else response = await api.content.getFeaturedContent();

      if (response.success && response.data) {
        const data = response.data;
        let items: ContentItem[] = Array.isArray(data)
          ? data
          : (data as ContentResponse).items || [];
        return items;
      }
      return [];
    },
    staleTime: 30000,
  });

  const categories = categoriesQuery.data ?? [];
  const universes = universesQuery.data ?? [];
  const rawContent = contentQuery.data ?? [];
  const isLoading = categoriesQuery.isLoading || universesQuery.isLoading || contentQuery.isLoading;
  const error =
    categoriesQuery.error?.message ||
    universesQuery.error?.message ||
    contentQuery.error?.message ||
    null;

  const content = (() => {
    let items = [...rawContent];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.creator?.name?.toLowerCase().includes(q)
      );
    }
    if (minRating > 0) items = items.filter((item) => (item.likes || 0) >= minRating);
    items = items.filter((item) => (item.duration || 0) <= maxDuration * 60);
    if (sortBy === 'Newest')
      items = [...items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    else if (sortBy === 'A-Z') items = [...items].sort((a, b) => a.title.localeCompare(b.title));
    return items;
  })();

  const clearFilters = () => {
    setSearchQuery('');
    setMinRating(0);
    setMaxDuration(300);
    setSelectedLanguage('all');
    setSelectedYear('all');
    setSelectedCategory(null);
    setSelectedUniverseId(null);
    setSortBy('Popular');
  };

  const activeFilterCount = [searchQuery, minRating > 0, maxDuration < 300].filter(Boolean).length;

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'var(--hp-bg)', color: 'var(--text-primary)' }}
    >
      <AppHeader active="Browse" logoVariant="light" />

      {/* Top Ambient Glow */}
      <div
        className="pointer-events-none absolute -top-32 left-1/3 -translate-x-1/2 w-[650px] h-[450px] rounded-full blur-[140px] -z-0"
        style={{
          background: 'radial-gradient(circle, rgba(232,66,10,0.16) 0%, rgba(204,28,28,0.05) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Page Title */}
        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-white/10 bg-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-orange)] animate-pulse" />
            <span className="tracking-widest uppercase text-white/70">DISCOVER</span>
          </div>
          <h1 className="az-headline font-extrabold text-white text-3xl sm:text-4xl tracking-tight">Browse Content</h1>
        </motion.div>

        {error && (
          <div className="mb-6">
            <ErrorState
              title="Failed to load content"
              description={error}
              buttonText="Retry"
              onButtonPress={() => contentQuery.refetch()}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Sidebar */}
          <motion.div
            className="lg:col-span-1 space-y-5 sm:space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Search */}
            <div className="az-glass p-4">
              <label htmlFor="browse-search" className="az-label">
                Search
              </label>
              <div className="relative">
                <input
                  id="browse-search"
                  type="search"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="az-input pl-10"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full az-glass flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
              aria-expanded={showFilters}
              aria-controls="advanced-filters"
            >
              <span className="font-medium text-white text-sm">Advanced Filters</span>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--brand-red)', color: 'var(--brand-white)' }}
                  >
                    {activeFilterCount}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-white/60 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {showFilters && (
              <div id="advanced-filters" className="az-glass p-4 space-y-4">
                <div>
                  <label htmlFor="rating-filter" className="az-label">
                    Min Rating: {minRating > 0 ? `${minRating}+` : 'Any'}
                  </label>
                  <input
                    id="rating-filter"
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full accent-[var(--brand-orange)]"
                  />
                </div>
                <div>
                  <label htmlFor="duration-filter" className="az-label">
                    Max Duration: {maxDuration < 300 ? `${maxDuration} min` : 'Any'}
                  </label>
                  <input
                    id="duration-filter"
                    type="range"
                    min="5"
                    max="300"
                    step="5"
                    value={maxDuration}
                    onChange={(e) => setMaxDuration(parseInt(e.target.value))}
                    className="w-full accent-[var(--brand-orange)]"
                  />
                </div>
                <div>
                  <label htmlFor="language-filter" className="az-label">
                    Language
                  </label>
                  <select
                    id="language-filter"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="az-input"
                  >
                    <option value="all">All Languages</option>
                    <option value="en">English</option>
                    <option value="yo">Yoruba</option>
                    <option value="ig">Igbo</option>
                    <option value="ha">Hausa</option>
                    <option value="pi">Pidgin</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="year-filter" className="az-label">
                    Year
                  </label>
                  <select
                    id="year-filter"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="az-input"
                  >
                    <option value="all">All Years</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                  </select>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    aria-label="Clear all filters"
                    className="w-full px-4 py-2 text-sm font-medium rounded-full transition-colors"
                    style={{
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'var(--brand-orange)',
                    }}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}

            {/* Categories */}
            <div className="az-glass p-4">
              <h3 id="categories-heading" className="font-bold text-white text-sm mb-3">
                Categories
              </h3>
              <ul
                ref={categoryListRef}
                role="listbox"
                aria-label="Content categories"
                aria-labelledby="categories-heading"
                className="space-y-1.5"
              >
                <li>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    onKeyDown={(e) => handleCategoryKeyDown(e, 0)}
                    aria-selected={!selectedCategory}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedCategory ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    style={
                      !selectedCategory
                        ? { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }
                        : {}
                    }
                  >
                    All Categories
                  </button>
                </li>
                {categories.map((category, index) => (
                  <li key={category.id}>
                    <button
                      onClick={() => setSelectedCategory(category.id)}
                      onKeyDown={(e) => handleCategoryKeyDown(e, index + 1)}
                      aria-selected={selectedCategory === category.id}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category.id ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                      style={
                        selectedCategory === category.id
                          ? { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }
                          : {}
                      }
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Universes */}
            <div className="az-glass p-4">
              <h3 id="universes-heading" className="font-bold text-white text-sm mb-3">
                Universes
              </h3>
              <ul
                ref={universeListRef}
                role="listbox"
                aria-label="Content universes"
                aria-labelledby="universes-heading"
                className="space-y-1.5"
              >
                <li>
                  <button
                    onClick={() => setSelectedUniverseId(null)}
                    onKeyDown={(e) => handleUniverseKeyDown(e, 0)}
                    aria-selected={!selectedUniverseId}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedUniverseId ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    style={
                      !selectedUniverseId
                        ? { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }
                        : {}
                    }
                  >
                    All Universes
                  </button>
                </li>
                {universes.map((universe, index) => (
                  <li key={universe.id}>
                    <button
                      onClick={() => setSelectedUniverseId(universe.id)}
                      onKeyDown={(e) => handleUniverseKeyDown(e, index + 1)}
                      aria-selected={selectedUniverseId === universe.id}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedUniverseId === universe.id ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                      style={
                        selectedUniverseId === universe.id
                          ? { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }
                          : {}
                      }
                    >
                      {getUniverseIcon(universe.name)}
                      {universe.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Content Grid */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Sort & Results Count */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedCategory
                    ? categories.find((c) => c.id === selectedCategory)?.name
                    : selectedUniverseId
                      ? universes.find((u) => u.id === selectedUniverseId)?.name
                      : 'All Content'}
                </h2>
                <p className="text-sm text-white/50 mt-0.5">
                  {content.length} result{content.length !== 1 ? 's' : ''}
                  {activeFilterCount > 0 &&
                    ` \u00B7 ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="sort-select" className="text-sm text-white/50">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="az-input w-auto text-sm py-1.5"
                >
                  <option>Popular</option>
                  <option>Newest</option>
                  <option>A-Z</option>
                  <option>Rating</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="az-glass overflow-hidden">
                    <Skeleton height="200px" borderRadius="0px" />
                    <div className="p-4 space-y-3">
                      <Skeleton width="80%" height="18px" />
                      <Skeleton width="60%" height="14px" />
                    </div>
                  </div>
                ))}
              </div>
            ) : content.length > 0 ? (
              <div
                ref={contentGridRef}
                role="grid"
                aria-label="Content results"
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
              >
                {content.map((item, index) => (
                  <a
                    key={item.id}
                    href={`/watch/${item.id}`}
                    role="article"
                    tabIndex={0}
                    onKeyDown={(e) => handleContentKeyDown(e, index)}
                    className="rounded-2xl overflow-hidden group cursor-pointer border border-[var(--hp-card-border)] bg-[var(--hp-card-bg)] hover:border-[rgba(232,66,10,0.4)] hover:shadow-[0_8px_30px_rgba(232,66,10,0.15)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--brand-orange)] flex flex-col"
                  >
                    <div className="relative h-48 flex items-center justify-center overflow-hidden bg-black/40">
                      {item.thumbnail ? (
                        <OptimizedImage
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--brand-orange)]/20 to-black/60"
                        >
                          <svg className="w-12 h-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625c.621 0 1.125-.504 1.125-1.125m-1.125 1.125h-7.5c-.621 0-1.125-.504-1.125-1.125m8.625 0V5.625m0 12.75v-1.5c0-.621-.504-1.125-1.125-1.125m0 0h-7.5m7.5 0V5.625m-8.625 12.75h-7.5m7.5 0V5.625" />
                          </svg>
                        </div>
                      )}
                      {/* Gradient Bottom overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--hp-card-bg)] via-transparent to-transparent opacity-80" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {item.universe?.name && (
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-orange)] mb-1">
                            {item.universe.name}
                          </p>
                        )}
                        <h4 className="font-bold text-white text-base mb-1 group-hover:text-[var(--brand-orange)] transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-white/50 text-xs line-clamp-2 mb-3 leading-relaxed">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-xs text-white/40">{item.creator?.name || 'Azeebo Originals'}</span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white group-hover:bg-[var(--brand-orange)] transition-colors"
                        >
                          Watch
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="Search"
                title="No content found"
                description="Try selecting a different category or universe"
                dark
                className="az-glass p-12"
              />
            )}
          </motion.div>
        </div>
      </main>

      <AppFooter logoVariant="light" />
    </div>
  );
}
