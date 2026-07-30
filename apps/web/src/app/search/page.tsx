'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@azeebo/ui/web';
import { apiFetch, api } from '../../lib/api';
import { OptimizedImage } from '@/components/OptimizedImage';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  category?: string;
  creator?: { name: string };
  universe?: { name: string; icon?: string };
  type?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface SearchFilters {
  type: string;
  category: string;
  duration: string;
  sortBy: string;
}

interface HistoryItem {
  query: string;
  timestamp: Date;
}

interface SearchResponse {
  results?: SearchResult[];
}

interface SuggestionsResponse {
  suggestions?: string[];
}

export default function SearchPage(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    category: 'all',
    duration: 'all',
    sortBy: 'relevance',
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const categoriesQuery = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.content.getCategories();
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to load categories');
      return res.data;
    },
    staleTime: 300000,
  });

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('searchHistory') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as HistoryItem[];
        setSearchHistory(parsed.map((item) => ({ ...item, timestamp: new Date(item.timestamp) })));
      } catch {
        /* intentionally minimal */
      }
    }
  }, []);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: results = [], isLoading } = useQuery<SearchResult[], Error>({
    queryKey: ['search', activeQuery, filters],
    queryFn: async () => {
      if (!activeQuery.trim()) return [];
      const params = new URLSearchParams({
        q: activeQuery,
        type: filters.type,
        category: filters.category,
        duration: filters.duration,
        sortBy: filters.sortBy,
      });
      const response = await apiFetch<SearchResponse | SearchResult[]>(
        `/v1/content/search?${params.toString()}`
      );
      if (response.success && response.data) {
        const data = response.data;
        return Array.isArray(data) ? data : (data as SearchResponse).results || [];
      }
      return [];
    },
    enabled: !!activeQuery.trim(),
    staleTime: 60000,
  });

  const { data: suggestionsData } = useQuery<string[], Error>({
    queryKey: ['suggestions', query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const response = await apiFetch<SuggestionsResponse | string[]>(
        `/v1/content/suggestions?q=${encodeURIComponent(query)}`
      );
      if (response.success && response.data) {
        return Array.isArray(response.data)
          ? response.data
          : (response.data as SuggestionsResponse).suggestions || [];
      }
      return [];
    },
    enabled: query.length >= 2,
    staleTime: 120000,
  });

  useEffect(() => {
    if (suggestionsData) {
      setSuggestions(suggestionsData);
    }
  }, [suggestionsData]);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  }, []);

  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setActiveQuery(searchQuery);
    setHasSearched(true);
    setShowSuggestions(false);
    const newHistoryItem = { query: searchQuery, timestamp: new Date() };
    setSearchHistory((prev) => {
      const updated = [newHistoryItem, ...prev.filter((item) => item.query !== searchQuery)].slice(
        0,
        10
      );
      localStorage.setItem('searchHistory', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        e.preventDefault();
        const first = suggestionsRef.current?.querySelector('button');
        first?.focus();
      }
    },
    [suggestions.length]
  );

  const handleSuggestionKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const buttons = suggestionsRef.current?.querySelectorAll('button');
    if (!buttons) return;
    let nextIndex = index;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % buttons.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + buttons.length) % buttons.length;
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      searchInputRef.current?.focus();
      return;
    }
    (buttons[nextIndex] as HTMLElement).focus();
  }, []);

  const handleHistoryKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const buttons = suggestionsRef.current?.querySelectorAll('[role="option"]');
    if (!buttons) return;
    let nextIndex = index;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % buttons.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + buttons.length) % buttons.length;
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      searchInputRef.current?.focus();
      return;
    }
    (buttons[nextIndex] as HTMLElement).focus();
  }, []);

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const filteredResults = results.filter((result) => {
    if (filters.type !== 'all' && result.type !== filters.type) return false;
    if (filters.category !== 'all' && result.category !== filters.category) return false;
    if (filters.duration !== 'all') {
      if (filters.duration === 'short' && (result.duration || 0) > 60) return false;
      if (
        filters.duration === 'medium' &&
        ((result.duration || 0) <= 60 || (result.duration || 0) > 180)
      )
        return false;
      if (filters.duration === 'long' && (result.duration || 0) <= 180) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Search" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="text-center mb-8">
          <h1 className="az-headline text-white text-3xl sm:text-4xl mb-2">Search Content</h1>
          <p className="text-white/50 text-sm">Discover movies, series, reality shows, and more</p>
        </div>

        {/* Search Form */}
        <div className="relative mb-8" ref={suggestionsRef}>
          <form
            onSubmit={handleSubmit}
            className="relative"
            role="search"
            aria-label="Search content"
          >
            <div className="az-glass flex items-center p-1">
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search for content..."
                className="flex-1 bg-transparent px-4 py-3 text-white placeholder-white/30 outline-none text-base"
                aria-label="Search query"
                aria-autocomplete="list"
                aria-controls="search-suggestions"
                aria-expanded={
                  showSuggestions && (suggestions.length > 0 || searchHistory.length > 0)
                }
                aria-describedby="search-instructions"
              />
              <button
                type="submit"
                className="az-btn-primary"
                style={{
                  width: 'auto',
                  paddingInline: '1.5rem',
                  margin: '0.25rem',
                  padding: '0.6rem 1.5rem',
                }}
                aria-label="Search"
              >
                Search
              </button>
            </div>
            <p id="search-instructions" className="sr-only">
              Type to search, use arrow keys to navigate suggestions, Enter to search, Escape to
              close suggestions.
            </p>
          </form>

          {/* Suggestions Dropdown */}
          {showSuggestions &&
            (suggestions.length > 0 || (searchHistory.length > 0 && query.length === 0)) && (
              <div
                id="search-suggestions"
                role="listbox"
                aria-label="Search suggestions"
                className="absolute top-full left-0 right-0 mt-2 az-glass p-2 z-50 max-h-80 overflow-y-auto"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowSuggestions(false);
                    searchInputRef.current?.focus();
                  }
                }}
              >
                {suggestions.length > 0 ? (
                  <div>
                    <p className="px-3 py-1 text-xs font-bold text-white/40 uppercase tracking-wider">
                      Suggestions
                    </p>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        role="option"
                        onClick={() => {
                          setQuery(suggestion);
                          handleSearch(suggestion);
                        }}
                        onKeyDown={(e) => handleSuggestionKeyDown(e, index)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 inline-block mr-3 text-white/40"
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
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between px-3 py-1">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
                        Recent Searches
                      </p>
                      <button
                        onClick={clearHistory}
                        className="text-xs text-[#E8420A] hover:text-[#CC1C1C] transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    {searchHistory.map((item, index) => (
                      <button
                        key={`${item.query}-${item.timestamp.getTime()}`}
                        role="option"
                        onClick={() => {
                          setQuery(item.query);
                          handleSearch(item.query);
                        }}
                        onKeyDown={(e) => handleHistoryKeyDown(e, index)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-between"
                      >
                        <span>
                          <svg
                            className="w-4 h-4 inline-block mr-3 text-white/40"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {item.query}
                        </span>
                        <span className="text-xs text-white/30">
                          {item.timestamp.toLocaleDateString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Filters */}
        {hasSearched && (
          <div className="mb-6 az-glass p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label htmlFor="filter-type" className="block text-sm font-bold text-white/50 mb-1">
                  Type
                </label>
                <select
                  id="filter-type"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="az-input w-full"
                >
                  <option value="all">All Types</option>
                  <option value="movie">Movies</option>
                  <option value="series">Series</option>
                  <option value="reality">Reality</option>
                  <option value="short">Short-form</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="filter-category"
                  className="block text-sm font-bold text-white/50 mb-1"
                >
                  Category
                </label>
                <select
                  id="filter-category"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="az-input w-full"
                >
                  <option value="all">All Categories</option>
                  {(categoriesQuery.data || []).map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="filter-duration"
                  className="block text-sm font-bold text-white/50 mb-1"
                >
                  Duration
                </label>
                <select
                  id="filter-duration"
                  value={filters.duration}
                  onChange={(e) => setFilters({ ...filters, duration: e.target.value })}
                  className="az-input w-full"
                >
                  <option value="all">Any Duration</option>
                  <option value="short">&lt; 1 hour</option>
                  <option value="medium">1-3 hours</option>
                  <option value="long">&gt; 3 hours</option>
                </select>
              </div>
              <div>
                <label htmlFor="filter-sort" className="block text-sm font-bold text-white/50 mb-1">
                  Sort By
                </label>
                <select
                  id="filter-sort"
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="az-input w-full"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Newest</option>
                  <option value="rating">Top Rated</option>
                  <option value="views">Most Viewed</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div role="region" aria-label="Search results" aria-live="polite">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="az-glass p-4 flex gap-4">
                  <Skeleton width="160px" height="90px" borderRadius="8px" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="70%" height="20px" />
                    <Skeleton width="50%" height="14px" />
                    <Skeleton width="40%" height="14px" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-white/50 mb-4">
                Found {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
              </p>
              {filteredResults.map((result) => (
                <a
                  key={result.id}
                  href={`/watch/${result.id}`}
                  className="az-glass p-4 flex gap-4 hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <div
                    className="w-40 h-24 rounded-lg overflow-hidden flex-shrink-0 relative"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(232,66,10,0.3), rgba(13,59,46,0.4))',
                    }}
                  >
                    {result.thumbnail ? (
                      <OptimizedImage
                        src={result.thumbnail}
                        alt={result.title}
                        fill
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-sm group-hover:text-[#E8420A] transition-colors">
                      {result.title}
                    </h3>
                    {result.description && (
                      <p className="text-xs text-white/45 mt-1 line-clamp-2">
                        {result.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                      {result.universe && (
                        <span
                          className="px-2 py-0.5 rounded"
                          style={{ background: 'rgba(232,66,10,0.15)', color: '#E8420A' }}
                        >
                          {result.universe.name}
                        </span>
                      )}
                      {result.creator && <span>{result.creator.name}</span>}
                      {result.duration && <span>{Math.floor(result.duration / 60)} min</span>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block">&#x1F50D;</span>
              <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
              <p className="text-white/50 text-sm">Try different keywords or adjust your filters</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block">&#x1F3AC;</span>
              <h3 className="text-xl font-bold text-white mb-2">Start exploring</h3>
              <p className="text-white/50 text-sm">
                Search for your favorite content, creators, or genres
              </p>
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
