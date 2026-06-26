'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function ComedyPage(): React.JSX.Element {
  const { isAuthenticated } = useAuth();
  const [clips, setClips] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        const result = await api.content.getContentByUniverse('comedy', 1, 20);

        if (result.success && result.data) {
          const items = Array.isArray(result.data) ? result.data : result.data.items || [];
          setClips(items);
        }
      } catch (err) {
        webLogger.error('Failed to fetch comedy content', err);
        setError('Failed to load comedy content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader />

      {/* Hero Section */}
      <section
        className="relative py-16"
        style={{ background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Comedy Universe</h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Laugh out loud with the best African comedy content. From hilarious skits to stand-up
              specials.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                type="button"
                className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                Browse Comedy
              </button>
              <button
                type="button"
                className="px-6 py-3 rounded-full text-sm font-semibold text-[#E8420A] transition-all"
                style={{ backgroundColor: '#fff' }}
              >
                Submit Your Clip
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Clips */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Trending Clips</h2>
            <p className="text-base mt-1 text-white/50">What everyone is laughing at</p>
          </div>
          <Link
            href="/browse"
            className="text-sm font-medium text-[#E8420A] hover:text-[#CC1C1C] transition-colors"
          >
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <div className="h-48 animate-pulse" style={{ backgroundColor: '#2A2A2A' }} />
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
        ) : error ? (
          <div className="text-center py-12">
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
        ) : clips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {clips.map((clip) => (
              <Link key={clip.id} href={`/watch/${clip.id}`}>
                <article
                  className="az-glass overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group"
                  style={{ boxShadow: '0 0 20px rgba(255,255,255,0.05)' }}
                >
                  <div className="relative">
                    <img
                      src={clip.thumbnail}
                      alt={clip.title}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/80 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1A0A0A">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-2 truncate text-white">{clip.title}</h3>
                    <p className="text-sm line-clamp-2 text-white/50">{clip.description}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No comedy clips available yet</p>
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Comedy Categories</h2>
            <p className="text-base mt-1 text-white/50">Find your favorite type of comedy</p>
          </div>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          role="listbox"
          aria-label="Comedy categories"
        >
          {[
            { name: 'Skits', icon: '🎭' },
            { name: 'Stand-up', icon: '🎤' },
            { name: 'Improv', icon: '🎨' },
            { name: 'Parodies', icon: '🎬' },
            { name: 'Roasts', icon: '🔥' },
            { name: 'Comedy Series', icon: '📺' },
          ].map((category) => (
            <button
              key={category.name}
              type="button"
              role="option"
              className="az-glass text-center cursor-pointer transition-all hover:scale-[1.02]"
            >
              <div className="p-4">
                <span className="text-3xl mb-2 block">{category.icon}</span>
                <h4 className="font-medium text-sm text-white">{category.name}</h4>
              </div>
            </button>
          ))}
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
