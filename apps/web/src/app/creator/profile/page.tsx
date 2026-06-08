'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface CreatorProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  totalContent: number;
  totalViews: number;
  isFollowing: boolean;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
  recentContent: Array<{
    id: string;
    title: string;
    thumbnail: string;
    views: number;
    type: 'video' | 'image' | 'audio';
  }>;
}

export default function CreatorProfilePage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creatorId = searchParams.get('creatorId') || '';
  
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadProfile();
  }, [creatorId]);

  const loadProfile = async (): Promise<void> => {
    try {
      const result = await apiFetch<CreatorProfile>(`/v1/creator/profile/${creatorId}`);

      if (result.success && result.data) {
        setProfile(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load creator profile', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (): Promise<void> => {
    if (!profile) return;
    setProfile({
      ...profile,
      isFollowing: !profile.isFollowing,
      followers: profile.isFollowing ? profile.followers - 1 : profile.followers + 1,
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'image':
        return '📷';
      case 'audio':
        return '🎵';
      default:
        return '📄';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Failed to load profile</p>
          <button
            onClick={loadProfile}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-foreground">Creator Profile</h1>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <img
              src={profile.avatar}
              alt={profile.displayName}
              className="w-32 h-32 rounded-full object-cover"
            />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-foreground">{profile.displayName}</h2>
              <p className="text-muted-foreground">@{profile.username}</p>
              <p className="text-foreground mt-4">{profile.bio}</p>

              <div className="flex justify-center md:justify-start gap-8 mt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{formatNumber(profile.followers)}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{formatNumber(profile.following)}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{profile.totalContent}</p>
                  <p className="text-sm text-muted-foreground">Content</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{formatNumber(profile.totalViews)}</p>
                  <p className="text-sm text-muted-foreground">Views</p>
                </div>
              </div>

              <button
                onClick={handleFollow}
                className={`mt-6 px-8 py-3 rounded-lg font-semibold ${
                  profile.isFollowing
                    ? 'bg-muted text-foreground'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                {profile.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        </div>

        {profile.socialLinks && (
          <div className="bg-card rounded-lg border border-border p-6 mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4">Social Links</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile.socialLinks.instagram && (
                <a
                  href={profile.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-muted rounded-lg hover:bg-accent transition-colors"
                >
                  <span className="text-2xl">📷</span>
                  <span className="text-foreground">Instagram</span>
                </a>
              )}
              {profile.socialLinks.twitter && (
                <a
                  href={profile.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-muted rounded-lg hover:bg-accent transition-colors"
                >
                  <span className="text-2xl">🐦</span>
                  <span className="text-foreground">Twitter</span>
                </a>
              )}
              {profile.socialLinks.youtube && (
                <a
                  href={profile.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-muted rounded-lg hover:bg-accent transition-colors"
                >
                  <span className="text-2xl">📺</span>
                  <span className="text-foreground">YouTube</span>
                </a>
              )}
              {profile.socialLinks.tiktok && (
                <a
                  href={profile.socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-muted rounded-lg hover:bg-accent transition-colors"
                >
                  <span className="text-2xl">🎵</span>
                  <span className="text-foreground">TikTok</span>
                </a>
              )}
            </div>
          </div>
        )}

        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Recent Content</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.recentContent.map((content) => (
              <div
                key={content.id}
                onClick={() => router.push(`/creator/content-detail?id=${content.id}`)}
                className="bg-muted rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <img
                    src={content.thumbnail}
                    alt={content.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 rounded-full w-8 h-8 flex items-center justify-center">
                    <span>{getTypeIcon(content.type)}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-foreground truncate">{content.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatNumber(content.views)} views
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
