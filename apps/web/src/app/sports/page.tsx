'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function SportsPage(): React.JSX.Element {
  const { isAuthenticated } = useAuth();
  const [matches, setMatches] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        const result = await api.content.getContentByUniverse('sports', 1, 20);

        if (result.success && result.data) {
          const items = Array.isArray(result.data) ? result.data : result.data.items || [];
          setMatches(items);
        }
      } catch (err) {
        webLogger.error('Failed to fetch sports content', err);
        setError('Failed to load sports content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Sports" />

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
        ) : matches.length > 0 ? (
          <div
            className="relative h-[500px]"
            style={{ background: 'linear-gradient(135deg, #0D3B2E, #E8420A)' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  <span className="text-white text-3xl font-bold">⚽</span>
                </div>
                <h2 className="text-4xl font-bold text-white mb-2">{matches[0].title}</h2>
                <p className="text-white/80 text-lg mb-6 max-w-2xl">{matches[0].description}</p>
                <div className="flex items-center justify-center gap-4">
                  <Link href={`/watch/${matches[0].id}`}>
                    <button
                      type="button"
                      className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    >
                      Watch Live
                    </button>
                  </Link>
                  <button
                    type="button"
                    className="px-6 py-3 rounded-full text-sm font-semibold transition-all"
                    style={{ backgroundColor: '#fff', color: '#0D3B2E' }}
                  >
                    Make Prediction
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[500px] flex items-center justify-center">
            <p className="text-lg text-white/60">No sports content available</p>
          </div>
        )}
      </section>

      {/* Content Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Featured Sports Content</h2>
            <p className="text-base mt-1 text-white/50">Don&apos;t miss the action</p>
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
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <Link key={match.id} href={`/watch/${match.id}`}>
                <article
                  className="az-glass overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ boxShadow: '0 0 20px rgba(255,255,255,0.05)' }}
                >
                  <div className="relative">
                    <img
                      src={match.thumbnail}
                      alt={match.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
                        style={{ backgroundColor: 'rgba(13,59,46,0.4)', color: '#4ADE80' }}
                      >
                        {match.contentType || 'Sport'}
                      </span>
                      <h3 className="text-xl font-bold text-white">{match.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-white/50 mb-3 line-clamp-2">{match.description}</p>
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
            <p className="text-lg text-white/50">No sports content available yet</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}
