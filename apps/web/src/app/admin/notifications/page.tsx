'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms' | 'in-app';
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationStats {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
}

export default function NotificationManagementPage(): JSX.Element {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'email' as const,
    subject: '',
    content: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      const [templatesRes, statsRes] = await Promise.all([
        api.admin.getNotificationTemplates(),
        api.admin.getNotificationStats(),
      ]);

      if (templatesRes.success && templatesRes.data) {
        setTemplates(templatesRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      webLogger.error('Failed to load notification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (): Promise<void> => {
    try {
      const response = await api.admin.createNotificationTemplate(newTemplate);
      if (response.success) {
        setShowCreateModal(false);
        loadData();
      }
    } catch (error) {
      webLogger.error('Failed to create template:', error);
    }
  };

  const toggleTemplate = async (id: string, isActive: boolean): Promise<void> => {
    try {
      await api.admin.updateNotificationTemplate(id, { isActive: !isActive });
      loadData();
    } catch (error) {
      webLogger.error('Failed to toggle template:', error);
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'email': return '📧';
      case 'push': return '🔔';
      case 'sms': return '📱';
      case 'in-app': return '💬';
      default: return '📢';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Notification Management</h1>
            <p className="text-muted-foreground">Manage notification templates and monitor delivery stats</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
          >
            Create Template
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Sent</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalSent.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Delivered</p>
              <p className="text-2xl font-bold text-green-500">{stats.delivered.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Opened</p>
              <p className="text-2xl font-bold text-blue-500">{stats.opened.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Clicked</p>
              <p className="text-2xl font-bold text-purple-500">{stats.clicked.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-500">{stats.failed.toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground">Notification Templates</h2>
          </div>
          <div className="divide-y divide-border">
            {templates.map((template) => (
              <div key={template.id} className="p-6 hover:bg-accent/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{getTypeIcon(template.type)}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-foreground">{template.name}</h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          template.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                        }`}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{template.subject}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Type: {template.type}</span>
                        <span>•</span>
                        <span>Updated: {new Date(template.updatedAt).toLocaleDateString()}</span>
                      </div>
                      {template.variables.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {template.variables.map((v) => (
                            <span key={v} className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleTemplate(template.id, template.isActive)}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      template.isActive
                        ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                    }`}
                  >
                    {template.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {templates.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-foreground mb-2">No templates yet</h2>
            <p className="text-muted-foreground">Create your first notification template</p>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border p-6 w-full max-w-2xl">
              <h2 className="text-2xl font-bold text-foreground mb-6">Create Notification Template</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                    placeholder="Template name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                  <select
                    value={newTemplate.type}
                    onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value as NotificationTemplate['type'] })}
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                  >
                    <option value="email">Email</option>
                    <option value="push">Push Notification</option>
                    <option value="sms">SMS</option>
                    <option value="in-app">In-App</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                  <input
                    type="text"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                    placeholder="Email subject or notification title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Content</label>
                  <textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                    rows={6}
                    placeholder="Use {{variable}} for dynamic content"
                  />
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
                  onClick={createTemplate}
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
