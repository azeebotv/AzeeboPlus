'use client';
import React from 'react';

import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../../lib/api';
import { focusNextElement, announceToScreenReader } from '../../lib/keyboard';

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration?: number;
  category?: string;
  universe?: { id: string; name: string; icon?: string };
  creator?: { name: string };
  rating?: number;
  year?: number;
  language?: string;
}

interface ContentResponse {
  items?: ContentItem[];
}

export default function BrowsePage(): JSX.Element {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [universes, setUniverses] = useState<{ id: string; name: string; icon?: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUniverse, setSelectedUniverse] = useState<string | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<string>('Popular');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [maxDuration, setMaxDuration] = useState<number>(300);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
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
    } else {
      return;
    }

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
    } else {
      return;
    }

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
    } else {
      return;
    }

    const card = cards[nextIndex] as HTMLElement;
    card.focus();
    const title = card.querySelector('h4')?.textContent;
    if (title) {
      announceToScreenReader(`Focused: ${title}`);
    }
  }, []);

  useEffect(() => {
    const fetchCategories = async (): Promise<void> => {
      try {
        const response = await api.content.getCategories();
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        // Error handling is intentionally minimal here
      }
    };

    const fetchUniverses = async (): Promise<void> => {
      try {
        const response = await api.universe.getUniverses();
        if (response.success && response.data) {
          setUniverses(response.data);
        }
      } catch (error) {
        // Error handling is intentionally minimal here
      }
    };

    fetchCategories();
    fetchUniverses();
  }, []);

  useEffect(() => {
    const fetchContent = async (): Promise<void> => {
      try {
        setIsLoading(true);

        let response;
        if (selectedUniverse) {
          response = await api.content.getContentByUniverse(selectedUniverse);
        } else if (selectedCategory) {
          response = await api.content.getContentByCategory(selectedCategory);
        } else {
          response = await api.content.getFeaturedContent();
        }

        if (response.success && response.data) {
          const data = response.data;
          let items: ContentItem[] = Array.isArray(data) ? data : (data as ContentResponse).items || [];

          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(
              (item) =>
                item.title.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query) ||
                item.creator?.name.toLowerCase().includes(query)
            );
          }

          if (minRating > 0) {
            items = items.filter((item) => (item.rating || 0) >= minRating);
          }

          items = items.filter((item) => (item.duration || 0) <= maxDuration * 60);

          if (selectedLanguage !== 'all') {
            items = items.filter((item) => item.language === selectedLanguage);
          }

          if (selectedYear !== 'all') {
            items = items.filter((item) => item.year?.toString() === selectedYear);
          }

          if (sortBy === 'Rating') {
            items = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
          } else if (sortBy === 'Newest') {
            items = [...items].sort((a, b) => (b.year || 0) - (a.year || 0));
          } else if (sortBy === 'A-Z') {
            items = [...items].sort((a, b) => a.title.localeCompare(b.title));
          }

          setContent(items);
          setHasMore(items.length >= 20);
        }
      } catch (error) {
        // Error handling is intentionally minimal here
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [selectedCategory, selectedUniverse, searchQuery, minRating, maxDuration, selectedLanguage, selectedYear, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setMinRating(0);
    setMaxDuration(300);
    setSelectedLanguage('all');
    setSelectedYear('all');
    setSelectedCategory(null);
    setSelectedUniverse(null);
    setSortBy('Popular');
  };

  const activeFilterCount = [
    searchQuery,
    minRating > 0,
    maxDuration < 300,
    selectedLanguage !== 'all',
    selectedYear !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl font-bold">Azeebo+</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/" className="font-medium hover:text-primary transition-colors">
              Home
            </a>
            <a href="/browse" className="font-medium text-primary border-b-2 border-primary pb-1">
              Browse
            </a>
            <a href="/library" className="font-medium hover:text-primary transition-colors">
              Library
            </a>
            <a href="/creators" className="font-medium hover:text-primary transition-colors">
              Creators
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <button className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Browse Content</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Search content"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between px-4 py-2 bg-card border border-border rounded-lg mb-4 hover:bg-muted transition-colors"
              aria-expanded={showFilters}
              aria-controls="advanced-filters"
            >
              <span className="font-medium text-foreground">Advanced Filters</span>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                <svg
                  className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {showFilters && (
              <div id="advanced-filters" className="bg-card rounded-lg border border-border p-4 mb-6 space-y-4">
                <div>
                  <label htmlFor="rating-filter" className="block text-sm font-medium text-foreground mb-2">
                    Minimum Rating: {minRating > 0 ? `${minRating}+ stars` : 'Any'}
                  </label>
                  <input
                    id="rating-filter"
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Any</span>
                    <span>5★</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="duration-filter" className="block text-sm font-medium text-foreground mb-2">
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
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5 min</span>
                    <span>5+ hours</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="language-filter" className="block text-sm font-medium text-foreground mb-2">
                    Language
                  </label>
                  <select
                    id="language-filter"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
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
                  <label htmlFor="year-filter" className="block text-sm font-medium text-foreground mb-2">
                    Year
                  </label>
                  <select
                    id="year-filter"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
                  >
                    <option value="all">All Years</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                  </select>
                </div>

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-sm text-primary border border-primary rounded-md hover:bg-primary/10 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}

            <div className="bg-card rounded-lg p-4 mb-6">
              <h3 id="categories-heading" className="font-bold text-lg mb-4">Categories</h3>
              <ul ref={categoryListRef} role="listbox" aria-label="Content categories" aria-labelledby="categories-heading" className="space-y-2 keyboard-navigable">
                <li>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    onKeyDown={(e) => handleCategoryKeyDown(e, 0)}
                    aria-selected={!selectedCategory}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      !selectedCategory ? 'bg-primary text-white' : 'hover:bg-muted'
                    }`}
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
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-primary text-white'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card rounded-lg p-4">
              <h3 id="universes-heading" className="font-bold text-lg mb-4">Universes</h3>
              <ul ref={universeListRef} role="listbox" aria-label="Content universes" aria-labelledby="universes-heading" className="space-y-2 keyboard-navigable">
                <li>
                  <button
                    onClick={() => setSelectedUniverse(null)}
                    onKeyDown={(e) => handleUniverseKeyDown(e, 0)}
                    aria-selected={!selectedUniverse}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      !selectedUniverse ? 'bg-primary text-white' : 'hover:bg-muted'
                    }`}
                  >
                    All Universes
                  </button>
                </li>
                {universes.map((universe, index) => (
                  <li key={universe.id}>
                    <button
                      onClick={() => setSelectedUniverse(universe.id)}
                      onKeyDown={(e) => handleUniverseKeyDown(e, index + 1)}
                      aria-selected={selectedUniverse === universe.id}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedUniverse === universe.id
                          ? 'bg-primary text-white'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {universe.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content Grid */}
          <div className="md:col-span-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold">
                  {selectedCategory
                    ? categories.find((c) => c.id === selectedCategory)?.name
                    : selectedUniverse
                      ? universes.find((u) => u.id === selectedUniverse)?.name
                      : 'All Content'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {content.length} result{content.length !== 1 ? 's' : ''}
                  {activeFilterCount > 0 && ` • ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label htmlFor="sort-select" className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 sm:flex-none border border-border rounded-md px-3 py-1 text-sm bg-card"
                >
                  <option>Popular</option>
                  <option>Newest</option>
                  <option>A-Z</option>
                  <option>Rating</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="bg-card rounded-lg overflow-hidden shadow-sm animate-pulse"
                  >
                    <div className="h-48 bg-muted"></div>
                    <div className="p-4">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div ref={contentGridRef} role="grid" aria-label="Content results" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 keyboard-navigable">
                {content.map((item, index) => (
                  <div
                    key={item.id}
                    role="article"
                    tabIndex={0}
                    onKeyDown={(e) => handleContentKeyDown(e, index)}
                    className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <div className="h-48 bg-muted flex items-center justify-center">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                      <p className="text-muted-foreground text-sm mb-3">
                        {item.description && item.description.length > 80
                          ? `${item.description.substring(0, 80)}...`
                          : item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {item.universe?.name || 'Unknown'}
                        </span>
                        <a
                          href={`/watch/${item.id}`}
                          className="text-primary hover:text-primary/80 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
                        >
                          Watch Now
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && content.length === 0 && (
              <div className="bg-card rounded-lg p-8 text-center">
                <svg
                  className="h-16 w-16 text-muted-foreground mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                <h3 className="text-lg font-medium mb-2">No content found</h3>
                <p className="text-muted-foreground">
                  Try selecting a different category or universe
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-muted border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold mb-4">Azeebo+</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Press
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Help</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2026 Azeebo+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
