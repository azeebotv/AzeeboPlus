'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import { Card, Button, Input, Switch, Badge, Modal, Tabs } from '@azeebo/ui';

interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  category: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SystemSettingsPage(): JSX.Element {
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    category: 'general',
    description: '',
    isPublic: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (): Promise<void> => {
    try {
      const response = await api.admin.getAllSettings();
      if (response.success && response.data) {
        setSettings(response.data as unknown as SystemSetting[]);
      }
    } catch (error) {
      webLogger.error('Failed to load settings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSetting = async (): Promise<void> => {
    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(newSetting.value);
      } catch {
        parsedValue = newSetting.value;
      }

      const response = await api.admin.createSetting({
        ...newSetting,
        value: parsedValue,
      });

      if (response.success) {
        setShowCreateModal(false);
        setNewSetting({
          key: '',
          value: '',
          category: 'general',
          description: '',
          isPublic: false,
        });
        loadSettings();
        alert('Setting created successfully');
      } else {
        alert(response.message || 'Failed to create setting');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create setting';
      alert(message);
    }
  };

  const handleEditSetting = (setting: SystemSetting): void => {
    setSelectedSetting(setting);
    setShowEditModal(true);
  };

  const handleUpdateSetting = async (): Promise<void> => {
    if (!selectedSetting) return;

    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(String(selectedSetting.value));
      } catch {
        parsedValue = selectedSetting.value;
      }

      const response = await api.admin.updateSetting(selectedSetting.key, {
        value: parsedValue,
        category: selectedSetting.category,
        description: selectedSetting.description,
        isPublic: selectedSetting.isPublic,
      });

      if (response.success) {
        setShowEditModal(false);
        loadSettings();
        alert('Setting updated successfully');
      } else {
        alert(response.message || 'Failed to update setting');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update setting';
      alert(message);
    }
  };

  const handleDeleteSetting = async (key: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this setting?')) {
      return;
    }

    try {
      const response = await api.admin.deleteSetting(key);
      if (response.success) {
        loadSettings();
        alert('Setting deleted successfully');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete setting';
      alert(message);
    }
  };

  const categories = ['all', ...new Set(settings.map((s) => s.category))];
  const filteredSettings =
    activeCategory === 'all' ? settings : settings.filter((s) => s.category === activeCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
            <p className="text-muted-foreground mt-1">Manage platform configuration and settings</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>Create Setting</Button>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredSettings.map((setting) => (
            <Card key={setting.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{setting.key}</h3>
                    <Badge variant={setting.isPublic ? 'primary' : 'secondary'}>
                      {setting.isPublic ? 'Public' : 'Private'}
                    </Badge>
                    <Badge variant="outline">{setting.category}</Badge>
                  </div>
                  {setting.description && (
                    <p className="text-sm text-muted-foreground mb-2">{setting.description}</p>
                  )}
                  <div className="bg-muted rounded p-3 font-mono text-sm">
                    <pre className="overflow-x-auto">
                      {typeof setting.value === 'object'
                        ? JSON.stringify(setting.value, null, 2)
                        : String(setting.value)}
                    </pre>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEditSetting(setting)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteSetting(setting.key)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Create Setting Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Setting"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Key (unique identifier)</label>
              <Input
                value={newSetting.key}
                onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                placeholder="e.g., site_name, max_upload_size"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Value (JSON supported)</label>
              <textarea
                className="w-full p-2 border rounded font-mono text-sm"
                rows={4}
                value={newSetting.value}
                onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                placeholder='{"key": "value"} or simple string'
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Input
                value={newSetting.category}
                onChange={(e) => setNewSetting({ ...newSetting, category: e.target.value })}
                placeholder="general, seo, social, email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full p-2 border rounded"
                rows={2}
                value={newSetting.description}
                onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                placeholder="Setting description"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newSetting.isPublic}
                onCheckedChange={(checked) => setNewSetting({ ...newSetting, isPublic: checked })}
              />
              <label className="text-sm font-medium">Public (accessible by non-admin users)</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSetting}>Create</Button>
            </div>
          </div>
        </Modal>

        {/* Edit Setting Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Edit Setting - ${selectedSetting?.key}`}
        >
          <div className="space-y-4">
            {selectedSetting && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Value</label>
                  <textarea
                    className="w-full p-2 border rounded font-mono text-sm"
                    rows={4}
                    value={
                      typeof selectedSetting.value === 'object'
                        ? JSON.stringify(selectedSetting.value, null, 2)
                        : String(selectedSetting.value)
                    }
                    onChange={(e) =>
                      setSelectedSetting({ ...selectedSetting, value: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Input
                    value={selectedSetting.category}
                    onChange={(e) =>
                      setSelectedSetting({ ...selectedSetting, category: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows={2}
                    value={selectedSetting.description || ''}
                    onChange={(e) =>
                      setSelectedSetting({ ...selectedSetting, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedSetting.isPublic}
                    onCheckedChange={(checked) =>
                      setSelectedSetting({ ...selectedSetting, isPublic: checked })
                    }
                  />
                  <label className="text-sm font-medium">Public</label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateSetting}>Update</Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
