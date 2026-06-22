'use client';
import React from 'react';

import { useEffect, useState } from 'react';
import { api, User, ContentItem } from '../../lib/api';
import { webLogger } from '@/lib/logger';

interface CreatorProfile extends User {
  contentCount: number;
  subscriberCount: number;
  bio?: string;
}

export default function CreatorsPage(): JSX.Element {
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
            <a href="/browse" className="font-medium hover:text-primary transition-colors">
              Browse
            </a>
            <a href="/library" className="font-medium hover:text-primary transition-colors">
              Library
            </a>
            <a href="/creators" className="font-medium text-primary border-b-2 border-primary pb-1">
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
        <h2 className="text-3xl font-bold mb-8">Top Creators</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-card rounded-lg overflow-hidden shadow-sm animate-pulse"
              >
                <div className="p-6 flex flex-col items-center">
                  <div className="h-24 w-24 rounded-full bg-muted mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <div
                key={creator.id}
                className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedCreator(creator)}
              >
                <div className="p-6 flex flex-col items-center">
                  <div className="h-24 w-24 rounded-full overflow-hidden mb-4">
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{creator.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4 text-center">{creator.bio}</p>
                  <div className="w-full flex justify-between items-center bg-muted rounded-lg p-3">
                    <span className="text-sm font-medium">
                      {creator.subscriberCount.toLocaleString()} followers
                    </span>
                    <button className="bg-primary text-white px-4 py-1 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                      Follow
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedCreator && (
          <div className="mt-12 bg-card rounded-lg p-6">
            <div className="flex items-start space-x-6">
              <div className="h-20 w-20 rounded-full overflow-hidden">
                <img
                  src={selectedCreator.avatar}
                  alt={selectedCreator.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-2xl">{selectedCreator.name}</h3>
                  <button className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    Follow
                  </button>
                </div>
                <p className="text-muted-foreground mb-4">{selectedCreator.bio}</p>
                <div className="flex space-x-6">
                  <span className="text-sm font-medium">
                    {selectedCreator.subscriberCount.toLocaleString()} followers
                  </span>
                  <span className="text-sm font-medium">{selectedCreator.contentCount} videos</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCreator(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-8">
              <h4 className="font-bold text-xl mb-6">Creator Content</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {creatorContent.map((item: ContentItem) => (
                  <div
                    key={item.id}
                    className="bg-muted rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h5 className="font-semibold mb-2">{item.title}</h5>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{item.views?.toLocaleString() || '0'} views</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
