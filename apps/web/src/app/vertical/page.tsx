'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { apiFetch, ContentItem } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function VerticalPage(): React.JSX.Element {
  const { isAuthenticated } = useAuth();
  const [series, setSeries] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        const result = await apiFetch<ContentItem[]>('/v1/content?universe=vertical&limit=20');

        if (result.success && result.data) {
          setSeries(result.data);
        }
      } catch (err) {
        webLogger.error('Failed to fetch vertical content', err);
        setError('Failed to load content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Vertical" />

      {/* Hero Section */}
      <section className="relative">
        {isLoading ? (
          <div className="h-[500px] animate-pulse" style={{ backgroundColor: '#2A2A2A' }} />
        ) : error ? (
          <div className="h-[500px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg mb-4 text-white/60">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="az-btn-primary"
                style={{ width: 'auto', paddingInline: '1.5rem' }}
              >
                Retry
              </button>
            </div>
          </div>
        ) : series.length > 0 ? (
          <div className="relative h-[500px]">
            <img
              src={series[0].thumbnail}
              alt={series[0].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A] via-[#1A0A0A]/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: '#E8420A', color: '#fff' }}
                >
                  Premium
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: '#E8420A' }}
                >
                  {series[0].contentType || 'Vertical'}
                </span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">{series[0].title}</h2>
              <p className="text-white/60 text-lg mb-6 max-w-2xl">{series[0].description}</p>
              <div className="flex items-center gap-4">
                <Link href={`/watch/${series[0].id}`}>
                  <button
                    type="button"
                    className="az-btn-primary"
                    style={{ width: 'auto', paddingInline: '2rem' }}
                  >
                    Start Watching
                  </button>
                </Link>
                <button
                  type="button"
                  className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all"
                  style={{
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  Character Lore
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[500px] flex items-center justify-center">
            <p className="text-lg text-white/60">No content available</p>
          </div>
        )}
      </section>

      {/* Series Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Vertical Series</h2>
            <p className="text-base mt-1 text-white/50">Premium African storytelling</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <div className="h-60 animate-pulse" style={{ backgroundColor: '#2A2A2A' }} />
                <div className="p-4 space-y-3">
                  <div
                    className="h-5 w-3/4 animate-pulse rounded"
                    style={{ backgroundColor: '#2A2A2A' }}
                  />
                  <div
                    className="h-4 w-1/2 animate-pulse rounded"
                    style={{ backgroundColor: '#2A2A2A' }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : series.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map((show) => (
              <Link key={show.id} href={`/watch/${show.id}`}>
                <article
                  className="az-glass overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ boxShadow: '0 0 20px rgba(255,255,255,0.05)' }}
                >
                  <div className="relative">
                    <img
                      src={show.thumbnail}
                      alt={show.title}
                      className="w-full h-48 object-cover"
                    />
                    <span
                      className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: '#E8420A', color: '#fff' }}
                    >
                      Premium
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
                        style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: '#E8420A' }}
                      >
                        {show.contentType || 'Vertical'}
                      </span>
                      <h3 className="text-xl font-bold text-white">{show.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-white/50 mb-3 line-clamp-2">{show.description}</p>
                    <button type="button" className="az-btn-primary w-full">
                      Watch Now
                    </button>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No series available yet</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}
