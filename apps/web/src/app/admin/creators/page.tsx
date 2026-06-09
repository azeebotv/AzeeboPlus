'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  email: string;
  status: 'active' | 'suspended' | 'pending' | 'banned';
  totalContent: number;
  totalFollowers: number;
  totalEarnings: number;
  joinedAt: string;
  isVerified: boolean;
}

export default function CreatorManagementPage(): JSX.Element {
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended' | 'pending' | 'banned'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async (): Promise<void> => {
    try {
      const response = await api.admin.getCreators();
      if (response.success && response.data) {
        setCreators((response.data.items || []) as unknown as Creator[]);
      }
    } catch (error) {
      webLogger.error('Failed to load creators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (creatorId: string, newStatus: string): Promise<void> => {
    try {
      const response = await api.admin.updateCreatorStatus(creatorId, newStatus);
      if (response.success) {
        loadCreators();
        alert(`Creator status updated to ${newStatus}`);
      } else {
        alert(response.message || 'Failed to update creator status');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update creator status';
      alert(message);
    }
  };

  const handleVerify = async (creatorId: string): Promise<void> => {
    try {
      const response = await api.admin.verifyCreator(creatorId);
      if (response.success) {
        loadCreators();
        alert('Creator verified successfully');
      } else {
        alert(response.message || 'Failed to verify creator');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify creator';
      alert(message);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'suspended':
        return 'text-yellow-500';
      case 'pending':
        return 'text-blue-500';
      case 'banned':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const filteredCreators = filter === 'all'
    ? creators
    : creators.filter((c) => c.status === filter);

  const searchedCreators = searchQuery
    ? filteredCreators.filter(
        (c) =>
          c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredCreators;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading creators...</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-foreground">Creator Management</h1>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
          />
          <div className="flex gap-2">
            {(['all', 'active', 'pending', 'suspended', 'banned'] as const).map((f) => (
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
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Creator</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Content</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Followers</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Earnings</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {searchedCreators.map((creator) => (
                <tr key={creator.id} className="hover:bg-accent/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={creator.avatar}
                        alt={creator.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          {creator.displayName}
                          {creator.isVerified && <span className="ml-1 text-blue-500">✓</span>}
                        </p>
                        <p className="text-sm text-muted-foreground">@{creator.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${getStatusColor(creator.status)}`}>
                      {creator.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground">{formatNumber(creator.totalContent)}</td>
                  <td className="px-6 py-4 text-foreground">{formatNumber(creator.totalFollowers)}</td>
                  <td className="px-6 py-4 text-foreground">₦{formatNumber(creator.totalEarnings)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {!creator.isVerified && (
                        <button
                          onClick={() => handleVerify(creator.id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          Verify
                        </button>
                      )}
                      {creator.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(creator.id, 'suspended')}
                          className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                        >
                          Suspend
                        </button>
                      )}
                      {creator.status === 'suspended' && (
                        <button
                          onClick={() => handleStatusChange(creator.id, 'active')}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          Activate
                        </button>
                      )}
                      {creator.status !== 'banned' && (
                        <button
                          onClick={() => handleStatusChange(creator.id, 'banned')}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        >
                          Ban
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
