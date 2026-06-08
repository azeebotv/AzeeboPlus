'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'update' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  publishedAt?: string;
  createdBy: string;
  targetAudience: string;
  views: number;
}

export default function AnnouncementCenterPage(): JSX.Element {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'info' as const,
    priority: 'medium' as const,
    targetAudience: 'all',
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async (): Promise<void> => {
    try {
      const result = await apiFetch<Announcement[]>('/api/v1/admin/announcements');

      if (result.success && result.data) {
        setAnnouncements(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load announcements', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAnnouncement = async (): Promise<void> => {
    try {
      const result = await apiFetch<unknown>('/api/v1/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(newAnnouncement),
      });

      if (result.success) {
        setShowCreateModal(false);
        loadAnnouncements();
      }
    } catch (error) {
      webLogger.error('Failed to create announcement', error);
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'low': return 'bg-gray-500/20 text-gray-500';
      case 'medium': return 'bg-blue-500/20 text-blue-500';
      case 'high': return 'bg-orange-500/20 text-orange-500';
      case 'critical': return 'bg-red-500/20 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'update': return '🔄';
      case 'maintenance': return '🔧';
      default: return '📢';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'published': return 'text-green-500';
      case 'draft': return 'text-yellow-500';
      case 'archived': return 'text-gray-500';
      default: return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Announcement Center</h1>
            <p className="text-muted-foreground">Manage platform-wide announcements and notifications</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
          >
            Create Announcement
          </button>
        </div>

        <div className="grid gap-6">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{getTypeIcon(announcement.type)}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-foreground">{announcement.title}</h3>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityColor(announcement.priority)}`}>
                        {announcement.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{announcement.content}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                      {announcement.publishedAt && (
                        <span>Published: {new Date(announcement.publishedAt).toLocaleDateString()}</span>
                      )}
                      <span>By: {announcement.createdBy}</span>
                      <span>Views: {announcement.views}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${getStatusColor(announcement.status)}`}>
                  {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Target: {announcement.targetAudience}</span>
              </div>
            </div>
          ))}
        </div>

        {announcements.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📢</div>
            <h2 className="text-xl font-bold text-foreground mb-2">No announcements yet</h2>
            <p className="text-muted-foreground">Create your first announcement to inform users</p>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border p-6 w-full max-w-2xl">
              <h2 className="text-2xl font-bold text-foreground mb-6">Create Announcement</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                    placeholder="Announcement title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Content</label>
                  <textarea
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                    rows={4}
                    placeholder="Announcement content"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                    <select
                      value={newAnnouncement.type}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value as 'info' | 'warning' | 'update' | 'maintenance' })}
                      className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="update">Update</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                    <select
                      value={newAnnouncement.priority}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                      className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Target Audience</label>
                  <select
                    value={newAnnouncement.targetAudience}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetAudience: e.target.value })}
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                  >
                    <option value="all">All Users</option>
                    <option value="premium">Premium Users</option>
                    <option value="creators">Creators</option>
                    <option value="admins">Admins</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-muted text-foreground rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={createAnnouncement}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
