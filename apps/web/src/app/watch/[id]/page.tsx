'use client';
import React from 'react';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api, ContentItem } from '../../../lib/api';
import { useRouter } from 'next/navigation';

interface Props {
  params: {
    id: string;
  };
}

export default function WatchPage({ params }: Props): JSX.Element {
  const { id } = params;
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedContent, setRelatedContent] = useState<ContentItem[]>([]);
  const [creatorContent, setCreatorContent] = useState<ContentItem[]>([]);

  useEffect(() => {
    const fetchContent = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const contentResponse = await api.content.getContent(id);
        if (!contentResponse.success || !contentResponse.data) {
          throw new Error(contentResponse.message || 'Content not found');
        }
        setContent(contentResponse.data);

        const [relatedRes, creatorRes] = await Promise.all([
          api.content.getRelatedContent(id),
          api.content.getContentByCreator(contentResponse.data.creator.id),
        ]);

        if (relatedRes.success && relatedRes.data) {
          setRelatedContent(relatedRes.data);
        }
        if (creatorRes.success && creatorRes.data) {
          setCreatorContent(creatorRes.data);
        }

        if (isAuthenticated) {
          const urlResponse = await api.content.getSignedUrl(id);
          if (urlResponse.success && urlResponse.data) {
            setSignedUrl(urlResponse.data.url);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/watch/${id}`);
    }
  }, [isAuthenticated, id, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <svg
            className="h-16 w-16 text-destructive mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.77-1.667-1.54-3-1.54H3.732c-1.333 0-2.228.77-3 1.54L.268 16c-.77.77-.77 2.052 0 2.828L12 22.5c.77.77 1.667 1.168 2.5 1.168z"
            />
          </svg>
          <h3 className="text-xl font-bold mb-2">{error || 'Content not found'}</h3>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-black bg-opacity-90 text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className="text-xl font-bold">Azeebo+</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/" className="font-medium hover:text-primary transition-colors">
              Home
            </a>
            <a href="/browse" className="font-medium hover:text-primary transition-colors">
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
            <button className="text-white hover:text-primary transition-colors">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </button>
            <button className="text-white hover:text-primary transition-colors">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-black rounded-lg overflow-hidden mb-6">
              {signedUrl ? (
                <video src={signedUrl} controls autoPlay className="w-full aspect-video" />
              ) : (
                <div className="w-full aspect-video flex items-center justify-center bg-black">
                  <div className="text-center text-white">
                    <svg
                      className="h-16 w-16 mx-auto mb-4"
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
                    <p>Video will play here</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-card rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-muted-foreground text-sm">{content.creator.name}</span>
                <span className="text-muted-foreground text-sm">•</span>
                <span className="text-muted-foreground text-sm">{content.universe.name}</span>
                <span className="text-muted-foreground text-sm">•</span>
                <span className="text-muted-foreground text-sm">
                  {new Date(content.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-muted-foreground mb-6">{content.description}</p>
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Play</span>
                </button>
                <button className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                  </svg>
                  <span>Save</span>
                </button>
                <button className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                  </svg>
                  <span>Share</span>
                </button>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6">
              <h3 className="text-xl font-bold mb-6">Comments</h3>
              <div className="mb-6">
                <textarea
                  className="w-full border border-border rounded-lg p-3 bg-card focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Add a comment..."
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    Post Comment
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-medium">JD</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">John Doe</h4>
                      <span className="text-xs text-muted-foreground">2 hours ago</span>
                    </div>
                    <p className="text-sm mb-2">This is an amazing video! Thanks for sharing.</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <button className="hover:text-primary transition-colors">Like</button>
                      <button className="hover:text-primary transition-colors">Reply</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-card rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Related Content</h3>
              <div className="space-y-4">
                {relatedContent.map((item) => (
                  <div
                    key={item.id}
                    className="flex space-x-4 hover:bg-muted/50 rounded-md p-2 transition-colors cursor-pointer"
                    onClick={() => router.push(`/watch/${item.id}`)}
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="h-20 w-28 bg-muted rounded-lg flex-shrink-0 object-cover"
                      />
                    ) : (
                      <div className="h-20 w-28 bg-muted rounded-lg flex-shrink-0"></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.creator.name}</p>
                      <p className="text-xs text-muted-foreground">{item.universe.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">More from Creator</h3>
              <div className="space-y-4">
                {creatorContent.map((item) => (
                  <div
                    key={item.id}
                    className="flex space-x-4 hover:bg-muted/50 rounded-md p-2 transition-colors cursor-pointer"
                    onClick={() => router.push(`/watch/${item.id}`)}
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="h-16 w-24 bg-muted rounded-lg flex-shrink-0 object-cover"
                      />
                    ) : (
                      <div className="h-16 w-24 bg-muted rounded-lg flex-shrink-0"></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.universe.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
