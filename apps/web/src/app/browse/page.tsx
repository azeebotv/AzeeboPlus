'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { ContentItem } from '../../lib/api';
import { announceToScreenReader } from '../../lib/keyboard';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import { OptimizedImage } from '../../components/OptimizedImage';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Clapperboard,
  ChevronDown,
  Search,
  Gamepad2,
  Trophy,
  Tv,
  Film,
  Sparkles,
} from 'lucide-react';

function getUniverseIcon(name: string): React.JSX.Element {
  const lower = name.toLowerCase();
  if (lower.includes('game'))
    return <Gamepad2 className="mr-2 inline size-4 text-az-warning-400" />;
  if (lower.includes('sport')) return <Trophy className="mr-2 inline size-4 text-az-success-400" />;
  if (lower.includes('reality') || lower.includes('show'))
    return <Tv className="mr-2 inline size-4 text-az-universe-reality" />;
  if (lower.includes('movie') || lower.includes('film') || lower.includes('cinema'))
    return <Film className="mr-2 inline size-4 text-az-universe-movies" />;
  return <Sparkles className="mr-2 inline size-4 text-az-flame" />;
}

interface ContentResponse {
  items?: ContentItem[];
}

/* Sidebar filter rows: the active row carries the brand gradient, idle rows
   stay frosted. Kept as constants because `az-*` shared classes and their
   utilities cannot mix in one className expression (no-dead-class-override). */
// Solid flame, deep ink: the scarlet stop of the brand gradient carries only
// 4.09:1 of dark ink at this 14px label size, and white on the flame stop is
// 3.18:1. The gradient stays on labels at large-text size (see globals.css).
const FILTER_ITEM_ACTIVE =
  'w-full rounded-az-control bg-az-flame px-3 py-2 text-left az-body-strong text-az-surface-root transition-colors';
const FILTER_ITEM_IDLE =
  'w-full rounded-az-control px-3 py-2 text-left az-body text-az-ink-muted transition-colors hover:bg-az-glass-fill hover:text-az-ink';

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
        // Some feed endpoints store duration only inside the metadata JSON
        // (ContentItem has no duration column) — lift it so the max-duration
        // slider filters on real values instead of filtering everything to 0.
        items = items.map((item) => ({
          ...item,
          duration:
            item.duration ??
            (item as unknown as { metadata?: { duration?: number } | null }).metadata?.duration,
        }));
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
    // Language and Year dropdowns filter on metadata seeded by
    // scripts/enrich-seed-content.mjs (meta.language / meta.releaseYear).
    const metaOf = (item: ContentItem) =>
      (item as unknown as { metadata?: { language?: string; releaseYear?: number } | null })
        .metadata ?? {};
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.creator?.name?.toLowerCase().includes(q)
      );
    }
    if (selectedLanguage !== 'all')
      items = items.filter((item) => metaOf(item).language === selectedLanguage);
    if (selectedYear !== 'all')
      items = items.filter((item) => String(metaOf(item).releaseYear ?? '') === selectedYear);
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
    <PageShell maxWidth="7xl" activeNav="Browse">
      <PageHero
        eyebrow="Discover"
        title="Browse Content"
        accentColor="var(--color-az-flame)"
        className="mb-6 sm:mb-8"
      />

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

      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-4">
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
                className="az-input az-input--icon"
              />
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-az-ink-muted"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="az-glass flex w-full items-center justify-between px-4 py-3 transition-colors"
            aria-expanded={showFilters}
            aria-controls="advanced-filters"
          >
            <span className="az-body text-az-ink">Advanced Filters</span>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="az-micro-label rounded-az-pill bg-az-scarlet px-2 py-0.5 font-bold text-az-ink">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                className={`size-4 text-az-ink-muted transition-transform ${
                  showFilters ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
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
                  className="w-full accent-az-flame"
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
                  className="w-full accent-az-flame"
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
                  className="w-full rounded-az-pill border border-az-ink/20 px-4 py-2 az-body text-az-flame transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Categories */}
          <div className="az-glass p-4">
            <h2 id="categories-heading" className="az-body-strong mb-3 text-az-ink">
              Categories
            </h2>
            {/* Filter buttons in a plain list; selected state via aria-pressed
                  (listbox/option semantics require focusable option children —
                  buttons inside li are invalid ARIA and fail Lighthouse). */}
            <ul
              ref={categoryListRef}
              aria-label="Content categories"
              aria-labelledby="categories-heading"
              className="space-y-1.5"
            >
              <li>
                <button
                  onClick={() => setSelectedCategory(null)}
                  onKeyDown={(e) => handleCategoryKeyDown(e, 0)}
                  aria-pressed={!selectedCategory}
                  className={!selectedCategory ? FILTER_ITEM_ACTIVE : FILTER_ITEM_IDLE}
                >
                  All Categories
                </button>
              </li>
              {categories.map((category, index) => (
                <li key={category.id}>
                  <button
                    onClick={() => setSelectedCategory(category.id)}
                    onKeyDown={(e) => handleCategoryKeyDown(e, index + 1)}
                    aria-pressed={selectedCategory === category.id}
                    className={
                      selectedCategory === category.id ? FILTER_ITEM_ACTIVE : FILTER_ITEM_IDLE
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
            <h2 id="universes-heading" className="az-body-strong mb-3 text-az-ink">
              Universes
            </h2>
            <ul
              ref={universeListRef}
              aria-label="Content universes"
              aria-labelledby="universes-heading"
              className="space-y-1.5"
            >
              <li>
                <button
                  onClick={() => setSelectedUniverseId(null)}
                  onKeyDown={(e) => handleUniverseKeyDown(e, 0)}
                  aria-pressed={!selectedUniverseId}
                  className={!selectedUniverseId ? FILTER_ITEM_ACTIVE : FILTER_ITEM_IDLE}
                >
                  All Universes
                </button>
              </li>
              {universes.map((universe, index) => (
                <li key={universe.id}>
                  <button
                    onClick={() => setSelectedUniverseId(universe.id)}
                    onKeyDown={(e) => handleUniverseKeyDown(e, index + 1)}
                    aria-pressed={selectedUniverseId === universe.id}
                    className={
                      selectedUniverseId === universe.id ? FILTER_ITEM_ACTIVE : FILTER_ITEM_IDLE
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
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="az-title text-az-ink">
                {selectedCategory
                  ? categories.find((c) => c.id === selectedCategory)?.name
                  : selectedUniverseId
                    ? universes.find((u) => u.id === selectedUniverseId)?.name
                    : 'All Content'}
              </h2>
              <p className="az-caption mt-0.5 text-az-ink-muted">
                {content.length} result{content.length !== 1 ? 's' : ''}
                {activeFilterCount > 0 &&
                  ` \u00B7 ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="sort-select" className="az-body text-az-ink-muted">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="az-input"
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
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-az-panel border border-az-glass-border bg-az-glass-card transition-all duration-300 hover:border-az-scarlet/40 hover:shadow-az-glow focus:outline-none focus:ring-2 focus:ring-az-scarlet"
                >
                  <div className="relative flex h-48 items-center justify-center overflow-hidden bg-az-surface-root/40">
                    {item.thumbnail ? (
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-az-flame/20 to-az-surface-root/60">
                        <Clapperboard
                          className="size-12 text-az-ink-muted"
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      </div>
                    )}
                    {/* Gradient Bottom overlay */}
                    <div className="az-scrim--hero absolute inset-0 opacity-80" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      {item.universe?.name && (
                        <p className="az-overline mb-1 text-az-flame">{item.universe.name}</p>
                      )}
                      <h4 className="az-body-strong mb-1 line-clamp-1 text-az-ink transition-colors group-hover:text-az-flame">
                        {item.title}
                      </h4>
                      <p className="az-caption mb-3 line-clamp-2 leading-relaxed text-az-ink-muted">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-az-glass-border pt-2">
                      <span className="az-caption text-az-ink-muted">
                        {item.creator?.name || 'Azeebo Originals'}
                      </span>
                      <span className="az-micro-label rounded-az-pill bg-az-glass-card px-2.5 py-1 font-bold uppercase tracking-wider text-az-ink transition-colors group-hover:bg-az-flame group-hover:text-az-surface-root">
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
    </PageShell>
  );
}
