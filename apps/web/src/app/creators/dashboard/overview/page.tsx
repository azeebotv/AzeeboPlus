'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { ContentItem } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import { Button, Card, Skeleton, Badge, Chip } from '@azeebo/ui';
import { colors } from '@azeebo/design-tokens';
import Link from 'next/link';

export default function OverviewPage(): JSX.Element {
  const [stats, setStats] = useState<{
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    followerCount: number;
    contentCount: number;
    totalEarnings: number;
    pendingEarnings: number;
    viewsChangePercentage: number;
    avgEngagementRate: number;
    totalFollowers: number;
    viewsChange: number;
    likesChange: number;
    commentsChange: number;
    followersChange: number;
  } | null>(null);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchOverview() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch creator stats
        const statsResponse = await api.creator.getStats();
        // Fetch recent content
        const contentResponse = await api.content.getMyContent({ limit: 5 });

        if (cancelled) return;

        if (statsResponse.success && contentResponse.success) {
          setStats(statsResponse.data ?? null);
          setRecentContent(contentResponse.data?.items || []);
        } else {
          const msg = statsResponse.message || contentResponse.message || 'Failed to load overview';
          setError(msg);
          webLogger.error('Failed to load creator overview', {
            statsError: statsResponse.message,
            contentError: contentResponse.message,
          });
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        webLogger.error('Failed to load creator overview', { error: message });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchOverview();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} padding="none">
              <Skeleton height="120px" />
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} padding="none">
              <Skeleton height="80px" />
              <Skeleton width="60%" height="20px" className="mt-3" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-lg" style={{ color: colors.text.secondary }}>
          {error}
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="none">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium" style={{ color: colors.text.primary }}>
                Total Earnings
              </h3>
              <Badge variant="outline" className="text-xs">
                Today
              </Badge>
            </div>
            <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
              ₦{stats?.totalEarnings?.toLocaleString() || '0'}
            </p>
            <p className="text-sm text-gray-500">
              {stats?.pendingEarnings?.toLocaleString() || '0'} pending
            </p>
          </div>
        </Card>

        <Card padding="none">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium" style={{ color: colors.text.primary }}>
                Content Views
              </h3>
              <Badge variant="outline" className="text-xs">
                Last 7 days
              </Badge>
            </div>
            <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
              {stats?.totalViews?.toLocaleString() || '0'}
            </p>
            <p className="text-sm text-gray-500">
              {stats?.viewsChangePercentage || 0}% vs last week
            </p>
          </div>
        </Card>

        <Card padding="none">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium" style={{ color: colors.text.primary }}>
                Fan Engagement
              </h3>
              <Badge variant="outline" className="text-xs">
                Average
              </Badge>
            </div>
            <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
              {stats?.avgEngagementRate?.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500">
              {stats?.totalFollowers?.toLocaleString() || '0'} followers
            </p>
          </div>
        </Card>
      </div>

      {/* Recent Content */}
      <Card padding="none">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>
              Recent Content
            </h3>
            <Link
              href="/creators/dashboard/content"
              className="text-sm text-primary-600 hover:underline"
            >
              View All
            </Link>
          </div>

          {recentContent.length > 0 ? (
            <div className="space-y-4">
              {recentContent.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium" style={{ color: colors.text.primary }}>
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        {item.views?.toLocaleString() || '0'} views
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M12 16h.01M8 16h.01M16 16h.01"
                          />
                        </svg>
                        {item.likes?.toLocaleString() || '0'} likes
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {item.contentType || 'Video'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No content yet</p>
              <Link href="/creators/content/upload" className="text-primary-600 hover:underline">
                Upload your first content
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
