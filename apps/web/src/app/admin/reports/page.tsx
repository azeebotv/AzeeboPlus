'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { webLogger } from '@/lib/logger';
import { api } from '@/lib/api';

interface PlatformReport {
  totalUsers: number;
  activeUsers: number;
  totalCreators: number;
  totalContent: number;
  totalRevenue: number;
  userGrowth: number;
  revenueGrowth: number;
  contentGrowth: number;
  topCreators: Array<{
    id: string;
    name: string;
    followers: number;
    revenue: number;
  }>;
  userDemographics: {
    ageGroups: Array<{ range: string; percentage: number }>;
    topCountries: Array<{ country: string; percentage: number }>;
    genderSplit: { male: number; female: number; other: number };
  };
  engagementMetrics: {
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    avgSessionDuration: number;
    retentionRate: number;
  };
}

export default function ReportsAnalyticsPage(): JSX.Element {
  const router = useRouter();
  const [report, setReport] = useState<PlatformReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadReport();
  }, [timeRange]);

  const loadReport = async (): Promise<void> => {
    try {
      const response = await api.admin.getReports(timeRange);
      if (response.success && response.data) {
        setReport(response.data);
      }
    } catch (error) {
      webLogger.error('Failed to load report', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Failed to load reports</p>
          <button
            onClick={loadReport}
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
        <div className="flex items-center justify-between mb-8 print:mb-4">
          <div>
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-2 print:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-foreground print:text-2xl">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground print:block hidden">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} | Time Range: {timeRange}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/reports/builder"
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 print:hidden"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Custom Report Builder
            </Link>
            <button
              onClick={handlePrint}
              className="print:hidden px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Print report"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Report
            </button>
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
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-foreground">{formatNumber(report.totalUsers)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Users</p>
            <p className={`text-sm font-medium mt-2 ${report.userGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {report.userGrowth >= 0 ? '↑' : '↓'} {Math.abs(report.userGrowth)}%
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-foreground">{formatNumber(report.activeUsers)}</p>
            <p className="text-sm text-muted-foreground mt-1">Active Users</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-foreground">{formatNumber(report.totalCreators)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Creators</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-foreground">{formatCurrency(report.totalRevenue)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Revenue</p>
            <p className={`text-sm font-medium mt-2 ${report.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {report.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(report.revenueGrowth)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Engagement Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{formatNumber(report.engagementMetrics.dailyActiveUsers)}</p>
                <p className="text-sm text-muted-foreground">Daily Active Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{formatNumber(report.engagementMetrics.monthlyActiveUsers)}</p>
                <p className="text-sm text-muted-foreground">Monthly Active Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{report.engagementMetrics.avgSessionDuration}m</p>
                <p className="text-sm text-muted-foreground">Avg Session Duration</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{report.engagementMetrics.retentionRate}%</p>
                <p className="text-sm text-muted-foreground">Retention Rate</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Top Creators</h2>
            <div className="space-y-3">
              {report.topCreators.slice(0, 5).map((creator, index) => (
                <div key={creator.id} className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary w-8">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-foreground">{creator.name}</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(creator.followers)} followers</p>
                    </div>
                  </div>
                  <p className="font-semibold text-foreground">{formatCurrency(creator.revenue)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">User Demographics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Age Groups</h3>
              <div className="space-y-3">
                {report.userDemographics.ageGroups.map((age) => (
                  <div key={age.range} className="flex items-center gap-3">
                    <span className="text-sm text-foreground w-16">{age.range}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${age.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-foreground w-12 text-right">{age.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Top Countries</h3>
              <div className="space-y-3">
                {report.userDemographics.topCountries.map((country) => (
                  <div key={country.country} className="flex items-center gap-3">
                    <span className="text-sm text-foreground w-24">{country.country}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${country.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-foreground w-12 text-right">{country.percentage}%</span>
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
