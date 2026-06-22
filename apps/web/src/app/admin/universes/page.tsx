'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import { Card, Button, Input, Switch, Badge, Modal } from '@azeebo/ui';

interface Universe {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  isEnabled: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  contentItems: number;
  featureFlags: FeatureFlag[];
  _count?: { contentItems?: number };
}

interface FeatureFlag {
  id: string;
  featureKey: string;
  isEnabled: boolean;
  metadata?: Record<string, unknown>;
}

export default function UniverseManagementPage(): JSX.Element {
  const router = useRouter();
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
  const [newUniverse, setNewUniverse] = useState({
    name: '',
    displayName: '',
    description: '',
    icon: '',
    color: '',
    isEnabled: true,
    sortOrder: 0,
  });

  useEffect(() => {
    loadUniverses();
  }, []);

  const loadUniverses = async (): Promise<void> => {
    try {
      const response = await api.admin.getAllUniverses();
      if (response.success && response.data) {
        setUniverses(response.data as unknown as Universe[]);
      }
    } catch (error) {
      webLogger.error('Failed to load universes', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUniverse = async (): Promise<void> => {
    try {
      const response = await api.admin.createUniverse(newUniverse);
      if (response.success) {
        setShowCreateModal(false);
        setNewUniverse({
          name: '',
          displayName: '',
          description: '',
          icon: '',
          color: '',
          isEnabled: true,
          sortOrder: 0,
        });
        loadUniverses();
        alert('Universe created successfully');
      } else {
        alert(response.message || 'Failed to create universe');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create universe';
      alert(message);
    }
  };

  const handleToggleUniverse = async (id: string, isEnabled: boolean): Promise<void> => {
    try {
      const response = await api.admin.toggleUniverse(id, isEnabled);
      if (response.success) {
        loadUniverses();
        alert(`Universe ${isEnabled ? 'enabled' : 'disabled'} successfully`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle universe';
      alert(message);
    }
  };

  const handleDeleteUniverse = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this universe? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.admin.deleteUniverse(id);
      if (response.success) {
        loadUniverses();
        alert('Universe deleted successfully');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete universe';
      alert(message);
    }
  };

  const handleManageFeatures = (universe: Universe): void => {
    setSelectedUniverse(universe);
    setShowFeatureModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading universes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Universe Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage platform universes and feature flags
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>Create Universe</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {universes.map((universe) => (
            <Card key={universe.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {universe.icon && (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: universe.color || '#8B5CF6' }}
                    >
                      {universe.icon}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{universe.displayName}</h3>
                    <p className="text-sm text-muted-foreground">{universe.name}</p>
                  </div>
                </div>
                <Badge variant={universe.isEnabled ? 'success' : 'error'}>
                  {universe.isEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              {universe.description && (
                <p className="text-sm text-muted-foreground mb-4">{universe.description}</p>
              )}

              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <span>{universe._count?.contentItems ?? universe.contentItems} content items</span>
                <span>•</span>
                <span>{universe.featureFlags.length} feature flags</span>
              </div>

              <div className="flex gap-2">
                <Switch
                  checked={universe.isEnabled}
                  onCheckedChange={(checked) => handleToggleUniverse(universe.id, checked)}
                />
                <Button variant="outline" size="sm" onClick={() => handleManageFeatures(universe)}>
                  Manage Features
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteUniverse(universe.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Create Universe Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Universe"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name (unique identifier)</label>
              <Input
                value={newUniverse.name}
                onChange={(e) => setNewUniverse({ ...newUniverse, name: e.target.value })}
                placeholder="e.g., reality, sports, games"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <Input
                value={newUniverse.displayName}
                onChange={(e) => setNewUniverse({ ...newUniverse, displayName: e.target.value })}
                placeholder="e.g., Reality Shows, Sports, Games"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full p-2 border rounded"
                rows={3}
                value={newUniverse.description}
                onChange={(e) => setNewUniverse({ ...newUniverse, description: e.target.value })}
                placeholder="Universe description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <Input
                  value={newUniverse.icon}
                  onChange={(e) => setNewUniverse({ ...newUniverse, icon: e.target.value })}
                  placeholder="🎭"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <Input
                  value={newUniverse.color}
                  onChange={(e) => setNewUniverse({ ...newUniverse, color: e.target.value })}
                  placeholder="#8B5CF6"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUniverse}>Create</Button>
            </div>
          </div>
        </Modal>

        {/* Feature Flags Modal */}
        <Modal
          isOpen={showFeatureModal}
          onClose={() => setShowFeatureModal(false)}
          title={`Feature Flags - ${selectedUniverse?.displayName}`}
        >
          <div className="space-y-4">
            {selectedUniverse?.featureFlags.map((flag) => (
              <div key={flag.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{flag.featureKey}</p>
                  {flag.metadata && (
                    <p className="text-sm text-muted-foreground">{JSON.stringify(flag.metadata)}</p>
                  )}
                </div>
                <Switch checked={flag.isEnabled} />
              </div>
            ))}
            {(!selectedUniverse?.featureFlags || selectedUniverse.featureFlags.length === 0) && (
              <p className="text-center text-muted-foreground">No feature flags configured</p>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setShowFeatureModal(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
