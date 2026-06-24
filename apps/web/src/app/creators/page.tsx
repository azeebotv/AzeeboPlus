'use client';
import React, { useEffect, useState } from 'react';
import { api, User, ContentItem } from '../../lib/api';
import { webLogger } from '@/lib/logger';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

interface CreatorProfile extends User {
  contentCount: number;
  subscriberCount: number;
  bio?: string;
}

export default function CreatorsPage(): React.JSX.Element {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);
  const [creatorContent, setCreatorContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCreators = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const response = await api.creator.getCreators(1, 20);
        if (response.success && response.data) {
          setCreators(response.data.items);
        }
      } catch (error) {
        webLogger.error('Failed to load creators', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCreators();
  }, []);

  useEffect(() => {
    const fetchCreatorContent = async (): Promise<void> => {
      if (!selectedCreator) return;
      try {
        const response = await api.creator.getCreatorContent(selectedCreator.id, 1, 10);
        if (response.success && response.data) {
          setCreatorContent(response.data.items);
        }
      } catch (error) {
        webLogger.error('Failed to load creator content', error);
      }
    };
    fetchCreatorContent();
  }, [selectedCreator]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Creators" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Top Creators</h1>
          <p className="text-white/50 text-lg">Discover amazing African content creators</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="az-glass p-6 flex flex-col items-center animate-pulse">
                <div
                  className="w-24 h-24 rounded-full mb-4"
                  style={{ backgroundColor: '#2A2A2A' }}
                />
                <div className="h-4 w-3/4 rounded mb-2" style={{ backgroundColor: '#2A2A2A' }} />
                <div className="h-3 w-1/2 rounded mb-4" style={{ backgroundColor: '#2A2A2A' }} />
                <div className="h-10 w-full rounded-full" style={{ backgroundColor: '#2A2A2A' }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
              role="listbox"
              aria-label="Creators"
            >
              {creators.map((creator) => (
                <div
                  key={creator.id}
                  onClick={() => setSelectedCreator(creator)}
                  role="option"
                  aria-selected={selectedCreator?.id === creator.id}
                  className={`az-glass p-6 cursor-pointer transition-all hover:scale-[1.02] text-center ${
                    selectedCreator?.id === creator.id ? 'ring-2' : ''
                  }`}
                  style={
                    selectedCreator?.id === creator.id
                      ? { boxShadow: '0 0 20px rgba(232,66,10,0.2)' }
                      : undefined
                  }
                >
                  <div
                    className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                  >
                    {creator.name?.charAt(0) || 'C'}
                  </div>
                  <h3 className="text-lg font-bold text-white">{creator.name}</h3>
                  <p className="text-sm text-white/50 mb-1">{creator.email}</p>
                  <div className="flex items-center justify-center gap-4 mt-3 text-sm">
                    <span className="text-white/60">{creator.contentCount} videos</span>
                    <span className="text-white/60">{creator.subscriberCount} subscribers</span>
                  </div>
                  {creator.bio && (
                    <p className="text-sm text-white/40 mt-3 line-clamp-2">{creator.bio}</p>
                  )}
                  <button
                    type="button"
                    className="w-full mt-4 py-2 rounded-full text-sm font-semibold transition-all az-btn-primary"
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>

            {selectedCreator && creatorContent.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">
                  {selectedCreator.name}&apos;s Content
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creatorContent.map((content) => (
                    <div key={content.id} className="az-glass overflow-hidden">
                      <img
                        src={content.thumbnail}
                        alt={content.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-bold text-white truncate">{content.title}</h3>
                        <p className="text-sm text-white/50 mt-1 line-clamp-2">
                          {content.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
