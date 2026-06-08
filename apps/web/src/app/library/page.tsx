'use client';
import React from 'react';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { api, ContentItem } from '../../lib/api';
import { webLogger } from '@/lib/logger';

interface SavedContentItem extends ContentItem {
  savedAt?: string;
}

interface WatchHistoryItem extends ContentItem {
  watchedAt: string;
  progress?: number;
}

export default function LibraryPage(): JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [savedContent, setSavedContent] = useState<SavedContentItem[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const fetchLibraryData = async (): Promise<void> => {
      try {
        setIsLoading(true);

        const historyResponse = await api.user.getWatchHistory(1, 20);
        if (historyResponse.success && historyResponse.data) {
          const items = historyResponse.data.items.map((item: ContentItem) => ({
            ...item,
            watchedAt: item.createdAt || new Date().toISOString(),
          }));
          setWatchHistory(items);
        }

        const featuredResponse = await api.content.getFeaturedContent(6);
        if (featuredResponse.success && featuredResponse.data) {
          setSavedContent(featuredResponse.data);
        }
      } catch (error) {
        webLogger.error('Failed to load library data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLibraryData();
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <></>; // Router will redirect
  }

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
            <a href="/library" className="font-medium text-primary border-b-2 border-primary pb-1">
              Library
            </a>
            <a href="/creators" className="font-medium hover:text-primary transition-colors">
              Creators
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">{user?.name}</span>
              <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">My Library</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Saved Content */}
          <div className="bg-card rounded-lg p-6">
            <h3 className="text-xl font-bold mb-6">Saved Content</h3>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex space-x-4 animate-pulse">
                    <div className="h-20 w-32 bg-muted rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : savedContent.length > 0 ? (
              <div className="space-y-4">
                {savedContent.map((item) => (
                  <div
                    key={item.id}
                    className="flex space-x-4 hover:bg-muted/50 rounded-md p-2 transition-colors"
                  >
                    <div className="h-20 w-32 bg-muted rounded overflow-hidden">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {item.universe.name}
                        </span>
                        <button className="text-primary hover:text-primary/80 text-sm font-medium">
                          Watch Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
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
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                <h3 className="text-lg font-medium mb-2">No saved content</h3>
                <p className="text-muted-foreground">Save content to watch later</p>
              </div>
            )}
          </div>

          {/* Watch History */}
          <div className="bg-card rounded-lg p-6">
            <h3 className="text-xl font-bold mb-6">Watch History</h3>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex space-x-4 animate-pulse">
                    <div className="h-20 w-32 bg-muted rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-2 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : watchHistory.length > 0 ? (
              <div className="space-y-4">
                {watchHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex space-x-4 hover:bg-muted/50 rounded-md p-2 transition-colors"
                  >
                    <div className="h-20 w-32 bg-muted rounded overflow-hidden relative">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      {item.progress != null && item.progress > 0 && item.progress < 100 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.watchedAt).toLocaleDateString()}
                        </span>
                        <button className="text-primary hover:text-primary/80 text-sm font-medium">
                          {(item.progress ?? 0) === 100 ? 'Watch Again' : 'Continue Watching'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
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
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-medium mb-2">No watch history</h3>
                <p className="text-muted-foreground">Your watch history will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Continue Watching */}
        {watchHistory.filter(
          (item) => item.progress != null && item.progress > 0 && item.progress < 100
        ).length > 0 && (
          <div className="mt-8 bg-card rounded-lg p-6">
            <h3 className="text-xl font-bold mb-6">Continue Watching</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {watchHistory
                .filter((item) => item.progress != null && item.progress > 0 && item.progress < 100)
                .map((item) => (
                  <div
                    key={item.id}
                    className="bg-muted rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${item.progress ?? 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {item.progress ?? 0}% watched
                        </span>
                        <button className="text-primary hover:text-primary/80 text-xs font-medium">
                          Continue
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
