'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalFollowers: number;
  totalEarnings: number;
  viewsGrowth: number;
  followersGrowth: number;
  earningsGrowth: number;
  topContent: Array<{
    id: string;
    title: string;
    views: number;
    thumbnail: string;
  }>;
  demographics: {
    ageGroups: Array<{ range: string; percentage: number }>;
    topCountries: Array<{ country: string; percentage: number }>;
    genderSplit: { male: number; female: number; other: number };
  };
  engagementMetrics: {
    avgWatchTime: number;
    completionRate: number;
    shareRate: number;
    commentRate: number;
  };
}

export default function CreatorAnalyticsPage(): JSX.Element {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async (): Promise<void> => {
    try {
      const result = await apiFetch<AnalyticsData>('/v1/creator/analytics');

      if (result.success && result.data) {
        setAnalytics(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load analytics', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Failed to load analytics</p>
          <button
            onClick={loadAnalytics}
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-foreground">Creator Analytics</h1>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              {range === '7d'
                ? '7 Days'
                : range === '30d'
                  ? '30 Days'
                  : range === '90d'
                    ? '90 Days'
                    : 'All Time'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-foreground">
              {formatNumber(analytics.totalViews)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Total Views</p>
            <p
              className={`text-sm font-medium mt-2 ${analytics.viewsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {analytics.viewsGrowth >= 0 ? '↑' : '↓'} {Math.abs(analytics.viewsGrowth)}%
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-foreground">
              {formatNumber(analytics.totalFollowers)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Followers</p>
            <p
              className={`text-sm font-medium mt-2 ${analytics.followersGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {analytics.followersGrowth >= 0 ? '↑' : '↓'} {Math.abs(analytics.followersGrowth)}%
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-foreground">
              ₦{formatNumber(analytics.totalEarnings)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Earnings</p>
            <p
              className={`text-sm font-medium mt-2 ${analytics.earningsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {analytics.earningsGrowth >= 0 ? '↑' : '↓'} {Math.abs(analytics.earningsGrowth)}%
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-foreground">
              {formatNumber(analytics.totalLikes)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Likes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Engagement Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {analytics.engagementMetrics.avgWatchTime}m
                </p>
                <p className="text-sm text-muted-foreground">Avg Watch Time</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {analytics.engagementMetrics.completionRate}%
                </p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {analytics.engagementMetrics.shareRate}%
                </p>
                <p className="text-sm text-muted-foreground">Share Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {analytics.engagementMetrics.commentRate}%
                </p>
                <p className="text-sm text-muted-foreground">Comment Rate</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Top Performing Content</h2>
            <div className="space-y-3">
              {analytics.topContent.slice(0, 5).map((content, index) => (
                <div key={content.id} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-primary w-8">#{index + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground truncate">{content.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(content.views)} views
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Audience Demographics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Age Groups</h3>
              <div className="space-y-3">
                {analytics.demographics.ageGroups.map((age) => (
                  <div key={age.range} className="flex items-center gap-3">
                    <span className="text-sm text-foreground w-16">{age.range}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${age.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-foreground w-12 text-right">
                      {age.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Top Countries</h3>
              <div className="space-y-3">
                {analytics.demographics.topCountries.map((country) => (
                  <div key={country.country} className="flex items-center gap-3">
                    <span className="text-sm text-foreground w-24">{country.country}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${country.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-foreground w-12 text-right">
                      {country.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
