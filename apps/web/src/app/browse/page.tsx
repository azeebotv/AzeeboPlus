'use client';
import React from 'react';

import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../../lib/api';
import { focusNextElement, announceToScreenReader } from '../../lib/keyboard';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import { Skeleton } from '@/components/Skeleton';

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

export default function BrowsePage(): React.JSX.Element {
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
  const categoryListRef = useRef<HTMLUListElement>(null);
  const universeListRef = useRef<HTMLUListElement>(null);
  const contentGridRef = useRef<HTMLDivElement>(null);

  const handleCategoryKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    const buttons = categoryListRef.current?.querySelectorAll('button');
    if (!buttons) return;
    let nextIndex = index;
    if (event.key === 'ArrowDown') { event.preventDefault(); nextIndex = (index + 1) % buttons.length; }
    else if (event.key === 'ArrowUp') { event.preventDefault(); nextIndex = (index - 1 + buttons.length) % buttons.length; }
    else if (event.key === 'Home') { event.preventDefault(); nextIndex = 0; }
    else if (event.key === 'End') { event.preventDefault(); nextIndex = buttons.length - 1; }
    else return;
    (buttons[nextIndex] as HTMLElement).focus();
  }, []);

  const handleUniverseKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    const buttons = universeListRef.current?.querySelectorAll('button');
    if (!buttons) return;
    let nextIndex = index;
    if (event.key === 'ArrowDown') { event.preventDefault(); nextIndex = (index + 1) % buttons.length; }
    else if (event.key === 'ArrowUp') { event.preventDefault(); nextIndex = (index - 1 + buttons.length) % buttons.length; }
    else if (event.key === 'Home') { event.preventDefault(); nextIndex = 0; }
    else if (event.key === 'End') { event.preventDefault(); nextIndex = buttons.length - 1; }
    else return;
    (buttons[nextIndex] as HTMLElement).focus();
  }, []);

  const handleContentKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    const cards = contentGridRef.current?.querySelectorAll('[role="article"]');
    if (!cards) return;
    const columns = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
    let nextIndex = index;
    if (event.key === 'ArrowRight') { event.preventDefault(); nextIndex = Math.min(index + 1, cards.length - 1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); nextIndex = Math.max(index - 1, 0); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); nextIndex = Math.min(index + columns, cards.length - 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); nextIndex = Math.max(index - columns, 0); }
    else return;
    const card = cards[nextIndex] as HTMLElement;
    card.focus();
    const title = card.querySelector('h4')?.textContent;
    if (title) announceToScreenReader(`Focused: ${title}`);
  }, []);

  useEffect(() => {
    const fetchCategories = async (): Promise<void> => {
      try {
        const response = await api.content.getCategories();
        if (response.success && response.data) setCategories(response.data);
      } catch { /* intentionally minimal */ }
    };
    const fetchUniverses = async (): Promise<void> => {
      try {
        const response = await api.universe.getUniverses();
        if (response.success && response.data) setUniverses(response.data);
      } catch { /* intentionally minimal */ }
    };
    fetchCategories();
    fetchUniverses();
  }, []);

  useEffect(() => {
    const fetchContent = async (): Promise<void> => {
      try {
        setIsLoading(true);
        let response;
        if (selectedUniverse) response = await api.content.getContentByUniverse(selectedUniverse);
        else if (selectedCategory) response = await api.content.getContentByCategory(selectedCategory);
        else response = await api.content.getFeaturedContent();

        if (response.success && response.data) {
          const data = response.data;
          let items: ContentItem[] = Array.isArray(data) ? data : (data as ContentResponse).items || [];
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter((item) => item.title.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q) || item.creator?.name.toLowerCase().includes(q));
          }
          if (minRating > 0) items = items.filter((item) => (item.rating || 0) >= minRating);
          items = items.filter((item) => (item.duration || 0) <= maxDuration * 60);
          if (selectedLanguage !== 'all') items = items.filter((item) => item.language === selectedLanguage);
          if (selectedYear !== 'all') items = items.filter((item) => item.year?.toString() === selectedYear);
          if (sortBy === 'Rating') items = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
          else if (sortBy === 'Newest') items = [...items].sort((a, b) => (b.year || 0) - (a.year || 0));
          else if (sortBy === 'A-Z') items = [...items].sort((a, b) => a.title.localeCompare(b.title));
          setContent(items);
        }
      } catch { /* intentionally minimal */ } finally { setIsLoading(false); }
    };
    fetchContent();
  }, [selectedCategory, selectedUniverse, searchQuery, minRating, maxDuration, selectedLanguage, selectedYear, sortBy]);

  const clearFilters = () => {
    setSearchQuery(''); setMinRating(0); setMaxDuration(300);
    setSelectedLanguage('all'); setSelectedYear('all');
    setSelectedCategory(null); setSelectedUniverse(null); setSortBy('Popular');
  };

  const activeFilterCount = [searchQuery, minRating > 0, maxDuration < 300, selectedLanguage !== 'all', selectedYear !== 'all'].filter(Boolean).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Browse" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Title */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#E8420A' }}>Discover</p>
          <h1 className="az-headline text-white text-3xl sm:text-4xl">Browse Content</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <div className="az-glass p-4">
              <label htmlFor="browse-search" className="az-label">Search</label>
              <div className="relative">
                <input
                  id="browse-search"
                  type="search"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="az-input pl-10"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#CC1C1C', color: '#fff' }}>{activeFilterCount}</span>
                )}
                <svg className={`w-4 h-4 text-white/60 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {showFilters && (
              <div id="advanced-filters" className="az-glass p-4 space-y-4">
                <div>
                  <label htmlFor="rating-filter" className="az-label">Min Rating: {minRating > 0 ? `${minRating}+` : 'Any'}</label>
                  <input id="rating-filter" type="range" min="0" max="5" step="0.5" value={minRating} onChange={(e) => setMinRating(parseFloat(e.target.value))} className="w-full accent-[#E8420A]" />
                </div>
                <div>
                  <label htmlFor="duration-filter" className="az-label">Max Duration: {maxDuration < 300 ? `${maxDuration} min` : 'Any'}</label>
                  <input id="duration-filter" type="range" min="5" max="300" step="5" value={maxDuration} onChange={(e) => setMaxDuration(parseInt(e.target.value))} className="w-full accent-[#E8420A]" />
                </div>
                <div>
                  <label htmlFor="language-filter" className="az-label">Language</label>
                  <select id="language-filter" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="az-input">
                    <option value="all">All Languages</option>
                    <option value="en">English</option>
                    <option value="yo">Yoruba</option>
                    <option value="ig">Igbo</option>
                    <option value="ha">Hausa</option>
                    <option value="pi">Pidgin</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="year-filter" className="az-label">Year</label>
                  <select id="year-filter" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="az-input">
                    <option value="all">All Years</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                  </select>
                </div>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="w-full px-4 py-2 text-sm font-medium rounded-full transition-colors" style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#E8420A' }}>Clear All Filters</button>
                )}
              </div>
            )}

            {/* Categories */}
            <div className="az-glass p-4">
              <h3 id="categories-heading" className="font-bold text-white text-sm mb-3">Categories</h3>
              <ul ref={categoryListRef} role="listbox" aria-label="Content categories" aria-labelledby="categories-heading" className="space-y-1.5">
                <li>
                  <button onClick={() => setSelectedCategory(null)} onKeyDown={(e) => handleCategoryKeyDown(e, 0)} aria-selected={!selectedCategory} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedCategory ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`} style={!selectedCategory ? { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' } : {}}>
                    All Categories
                  </button>
                </li>
                {categories.map((category, index) => (
                  <li key={category.id}>
                    <button onClick={() => setSelectedCategory(category.id)} onKeyDown={(e) => handleCategoryKeyDown(e, index + 1)} aria-selected={selectedCategory === category.id} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category.id ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`} style={selectedCategory === category.id ? { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' } : {}}>
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Universes */}
            <div className="az-glass p-4">
              <h3 id="universes-heading" className="font-bold text-white text-sm mb-3">Universes</h3>
              <ul ref={universeListRef} role="listbox" aria-label="Content universes" aria-labelledby="universes-heading" className="space-y-1.5">
                <li>
                  <button onClick={() => setSelectedUniverse(null)} onKeyDown={(e) => handleUniverseKeyDown(e, 0)} aria-selected={!selectedUniverse} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedUniverse ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`} style={!selectedUniverse ? { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' } : {}}>
                    All Universes
                  </button>
                </li>
                {universes.map((universe, index) => (
                  <li key={universe.id}>
                    <button onClick={() => setSelectedUniverse(universe.id)} onKeyDown={(e) => handleUniverseKeyDown(e, index + 1)} aria-selected={selectedUniverse === universe.id} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedUniverse === universe.id ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`} style={selectedUniverse === universe.id ? { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' } : {}}>
                      {universe.icon && <span className="mr-2">{universe.icon}</span>}
                      {universe.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content Grid */}
          <div className="lg:col-span-3">
            {/* Sort & Results Count */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedCategory ? categories.find((c) => c.id === selectedCategory)?.name : selectedUniverse ? universes.find((u) => u.id === selectedUniverse)?.name : 'All Content'}
                </h2>
                <p className="text-sm text-white/50 mt-0.5">
                  {content.length} result{content.length !== 1 ? 's' : ''}
                  {activeFilterCount > 0 && ` \u00B7 ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="sort-select" className="text-sm text-white/50">Sort by:</label>
                <select id="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="az-input w-auto text-sm py-1.5">
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
              <div ref={contentGridRef} role="grid" aria-label="Content results" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {content.map((item, index) => (
                  <a
                    key={item.id}
                    href={`/watch/${item.id}`}
                    role="article"
                    tabIndex={0}
                    onKeyDown={(e) => handleContentKeyDown(e, index)}
                    className="az-glass overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E8420A]"
                  >
                    <div className="relative h-48 flex items-center justify-center overflow-hidden">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(232,66,10,0.3), rgba(13,59,46,0.4))' }}>
                          <span style={{ fontSize: 48 }}>{item.universe?.icon || '\uD83C\uDFAC'}</span>
                        </div>
                      )}
                      {item.rating && item.rating >= 4 && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded" style={{ background: 'rgba(232,66,10,0.9)', color: '#fff' }}>Top Rated</span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1">{item.universe?.name}</p>
                      <h4 className="font-bold text-white text-sm mb-1 group-hover:text-[#E8420A] transition-colors line-clamp-1">{item.title}</h4>
                      <p className="text-white/45 text-xs line-clamp-2 mb-3">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40">{item.creator?.name}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: '#E8420A' }}>Watch</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="az-glass p-12 text-center">
                <span className="text-5xl mb-4 block">&#x1F50D;</span>
                <h3 className="text-lg font-bold text-white mb-2">No content found</h3>
                <p className="text-white/50 text-sm">Try selecting a different category or universe</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
