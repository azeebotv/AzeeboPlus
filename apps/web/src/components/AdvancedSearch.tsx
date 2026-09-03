'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Search, Filter, X } from 'lucide-react';

interface SearchFilters {
  query: string;
  type: string[];
  genre: string[];
  year: string[];
  rating: string;
  availability: string[];
  sortBy: string;
  sortOrder: string;
}

interface SearchResult {
  id: string;
  title: string;
  type: string;
  thumbnail: string;
  description: string;
  rating: number;
  year: number;
  genre: string[];
}

const CONTENT_TYPES = [
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'Series' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'music', label: 'Music' },
  { value: 'game', label: 'Games' },
  { value: 'lifestyle', label: 'Lifestyle' },
];

const GENRES = [
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Documentary',
  'Animation',
  'Reality',
  'Sports',
];

const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020'];

const RATINGS = [
  { value: 'all', label: 'All Ratings' },
  { value: '4+', label: '4+ Stars' },
  { value: '3+', label: '3+ Stars' },
  { value: '2+', label: '2+ Stars' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Rating' },
  { value: 'year', label: 'Year' },
  { value: 'title', label: 'Title' },
];

export function AdvancedSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: [],
    genre: [],
    year: [],
    rating: 'all',
    availability: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [showFilters, setShowFilters] = useState(false);

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.query) params.append('q', filters.query);
      if (filters.type.length) params.append('type', filters.type.join(','));
      if (filters.genre.length) params.append('genre', filters.genre.join(','));
      if (filters.year.length) params.append('year', filters.year.join(','));
      if (filters.rating !== 'all') params.append('rating', filters.rating);
      if (filters.availability.length)
        params.append('availability', filters.availability.join(','));
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      const res = await apiFetch<SearchResult[]>(`/search?${params.toString()}`);
      return res.success ? res.data || [] : [];
    },
    enabled: filters.query.length > 0,
    staleTime: 30000,
  });

  const activeFilterCount =
    filters.type.length +
    filters.genre.length +
    filters.year.length +
    filters.availability.length +
    (filters.rating !== 'all' ? 1 : 0);

  const updateFilter = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleArrayFilter = useCallback(
    (key: 'type' | 'genre' | 'year' | 'availability', value: string) => {
      setFilters((prev) => ({
        ...prev,
        [key]: prev[key].includes(value)
          ? prev[key].filter((v) => v !== value)
          : [...prev[key], value],
      }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({
      query: filters.query,
      type: [],
      genre: [],
      year: [],
      rating: 'all',
      availability: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  }, [filters.query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid var(--glass-border)',
            backgroundColor: 'var(--glass-bg)',
          }}
        >
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            placeholder="Search movies, shows, music..."
            style={{
              flex: 1,
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 16,
              outline: 'none',
            }}
          />
          {filters.query && (
            <button
              onClick={() => updateFilter('query', '')}
              style={{
                padding: 4,
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            borderRadius: 12,
            border: `1px solid ${showFilters ? 'var(--brand-orange)' : 'var(--glass-border)'}`,
            backgroundColor: showFilters ? 'rgba(232, 66, 10, 0.1)' : 'var(--glass-bg)',
            color: showFilters ? 'var(--brand-orange)' : 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          <Filter size={18} />
          Filters
          {activeFilterCount > 0 && (
            <span
              style={{
                padding: '2px 6px',
                borderRadius: 4,
                backgroundColor: 'var(--brand-orange)',
                color: 'white',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            border: '1px solid var(--glass-border)',
            backgroundColor: 'var(--glass-bg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Filters</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--brand-orange)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Content Type */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                color: 'var(--text-muted)',
                marginBottom: 8,
              }}
            >
              Content Type
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => toggleArrayFilter('type', type.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: `1px solid ${filters.type.includes(type.value) ? 'var(--brand-orange)' : 'var(--glass-border)'}`,
                    backgroundColor: filters.type.includes(type.value)
                      ? 'rgba(232, 66, 10, 0.1)'
                      : 'transparent',
                    color: filters.type.includes(type.value)
                      ? 'var(--brand-orange)'
                      : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genre */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                color: 'var(--text-muted)',
                marginBottom: 8,
              }}
            >
              Genre
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleArrayFilter('genre', genre)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: `1px solid ${filters.genre.includes(genre) ? 'var(--brand-orange)' : 'var(--glass-border)'}`,
                    backgroundColor: filters.genre.includes(genre)
                      ? 'rgba(232, 66, 10, 0.1)'
                      : 'transparent',
                    color: filters.genre.includes(genre)
                      ? 'var(--brand-orange)'
                      : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Year and Rating */}
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}
              >
                Year
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {YEARS.map((year) => (
                  <button
                    key={year}
                    onClick={() => toggleArrayFilter('year', year)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: `1px solid ${filters.year.includes(year) ? 'var(--brand-orange)' : 'var(--glass-border)'}`,
                      backgroundColor: filters.year.includes(year)
                        ? 'rgba(232, 66, 10, 0.1)'
                        : 'transparent',
                      color: filters.year.includes(year)
                        ? 'var(--brand-orange)'
                        : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}
              >
                Rating
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {RATINGS.map((rating) => (
                  <button
                    key={rating.value}
                    onClick={() => updateFilter('rating', rating.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: `1px solid ${filters.rating === rating.value ? 'var(--brand-orange)' : 'var(--glass-border)'}`,
                      backgroundColor:
                        filters.rating === rating.value ? 'rgba(232, 66, 10, 0.1)' : 'transparent',
                      color:
                        filters.rating === rating.value
                          ? 'var(--brand-orange)'
                          : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    {rating.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sort */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                color: 'var(--text-muted)',
                marginBottom: 8,
              }}
            >
              Sort by
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--glass-border)',
                backgroundColor: 'var(--glass-bg)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Search Results */}
      {isLoading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Searching...
        </div>
      )}

      {results && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {results.length} results found
          </div>
          {results.map((result) => (
            <div
              key={result.id}
              style={{
                display: 'flex',
                gap: 16,
                padding: 16,
                borderRadius: 12,
                border: '1px solid var(--glass-border)',
                backgroundColor: 'var(--glass-bg)',
                cursor: 'pointer',
              }}
            >
              <img
                src={result.thumbnail}
                alt={result.title}
                style={{ width: 80, height: 120, objectFit: 'cover', borderRadius: 8 }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{result.title}</h4>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    marginBottom: 8,
                    lineHeight: 1.5,
                  }}
                >
                  {result.description}
                </p>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>⭐ {result.rating}</span>
                  <span>{result.year}</span>
                  <span>{result.genre.join(', ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results && results.length === 0 && filters.query && !isLoading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          No results found for "{filters.query}"
        </div>
      )}
    </div>
  );
}
