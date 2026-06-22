'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface RealityShow {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  status: 'active' | 'upcoming' | 'completed' | 'paused';
  totalEpisodes: number;
  totalContestants: number;
  totalVotes: number;
  startDate: string;
  endDate?: string;
}

export default function RealityManagementPage(): JSX.Element {
  const router = useRouter();
  const [shows, setShows] = useState<RealityShow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed' | 'paused'>(
    'all'
  );

  useEffect(() => {
    loadShows();
  }, []);

  const loadShows = async (): Promise<void> => {
    try {
      const response = await api.admin.getRealityShows();
      if (response.success && response.data) {
        setShows((response.data.items || []) as unknown as RealityShow[]);
      }
    } catch (error) {
      webLogger.error('Failed to load reality shows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (showId: string, newStatus: string): Promise<void> => {
    try {
      const response = await api.admin.updateRealityShowStatus(showId, newStatus);
      if (response.success) {
        loadShows();
        alert(`Show status updated to ${newStatus}`);
      } else {
        alert(response.message || 'Failed to update show status');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update show status';
      alert(message);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'upcoming':
        return 'text-blue-500';
      case 'completed':
        return 'text-gray-500';
      case 'paused':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const filteredShows = filter === 'all' ? shows : shows.filter((s) => s.status === filter);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading reality shows...</p>
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
            <h1 className="text-3xl font-bold text-foreground">Reality Management</h1>
          </div>
          <button
            onClick={() => router.push('/admin/reality-shows/new')}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
          >
            + New Show
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'active', 'upcoming', 'completed', 'paused'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShows.map((show) => (
            <div key={show.id} className="bg-card rounded-lg border border-border overflow-hidden">
              <img src={show.thumbnail} alt={show.name} className="w-full h-40 object-cover" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-foreground">{show.name}</h3>
                  <span className={`text-sm font-medium ${getStatusColor(show.status)}`}>
                    {show.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {show.description}
                </p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{show.totalEpisodes}</p>
                    <p className="text-xs text-muted-foreground">Episodes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{show.totalContestants}</p>
                    <p className="text-xs text-muted-foreground">Contestants</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">
                      {show.totalVotes.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Votes</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {show.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(show.id, 'paused')}
                      className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                    >
                      Pause
                    </button>
                  )}
                  {show.status === 'paused' && (
                    <button
                      onClick={() => handleStatusChange(show.id, 'active')}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      Resume
                    </button>
                  )}
                  {show.status === 'upcoming' && (
                    <button
                      onClick={() => handleStatusChange(show.id, 'active')}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      Start
                    </button>
                  )}
                  {show.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(show.id, 'completed')}
                      className="flex-1 px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
