import { useConfirm } from "@/components/ui";
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { NavigationMenu, MenuItem } from '@/lib/admin-types';
import { useAuth } from '@/context/AuthContext';
import { Icon } from '@/components/Icons';

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--admin-card)',
  borderRadius: 12,
  border: '1px solid var(--admin-surface)',
  padding: 24,
  marginBottom: 24,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--admin-surface)',
  backgroundColor: 'var(--admin-dark)',
  color: 'var(--admin-text)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  backgroundColor: 'var(--admin-primary)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const btnSecondary: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid var(--admin-surface)',
  backgroundColor: 'var(--admin-dark)',
  color: 'var(--admin-text)',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const btnDanger: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid #ef444433',
  backgroundColor: '#ef444415',
  color: '#ef4444',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

export default function MenusPage(): React.JSX.Element {
  const confirm = useConfirm();
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';
  const queryClient = useQueryClient();

  const [selectedMenuId, setSelectedMenuId] = useState<string>('main-header');
  const [editingItems, setEditingItems] = useState<MenuItem[] | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New Menu form state
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuLocation, setNewMenuLocation] = useState('header');
  const [newMenuDescription, setNewMenuDescription] = useState('');

  // Item form state
  const [itemLabel, setItemLabel] = useState('');
  const [itemHref, setItemHref] = useState('');
  const [itemIcon, setItemIcon] = useState('compass');
  const [itemIsVisible, setItemIsVisible] = useState(true);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const { data: menus = [], isLoading, error } = useQuery<NavigationMenu[]>({
    queryKey: ['admin', 'menus'],
    queryFn: async () => {
      const res = await adminApi.listMenus();
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const selectedMenu = useMemo(() => {
    if (!menus.length) return null;
    return menus.find((m) => m.id === selectedMenuId) || menus[0];
  }, [menus, selectedMenuId]);

  // Keep local editing state synced when selected menu changes
  const activeItems: MenuItem[] = useMemo(() => {
    if (editingItems !== null) return editingItems;
    return selectedMenu?.items || [];
  }, [editingItems, selectedMenu]);

  // Mutations
  const updateMenuMutation = useMutation({
    mutationFn: async (payload: { id: string; items: MenuItem[]; name?: string; location?: string; description?: string }) => {
      return adminApi.updateMenu(payload.id, {
        name: payload.name,
        location: payload.location,
        description: payload.description,
        items: payload.items,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'menus'] });
      setEditingItems(null);
      showToast('Menu configuration and visibility list saved successfully!');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to save menu configuration', 'error');
    },
  });

  const createMenuMutation = useMutation({
    mutationFn: async (payload: { name: string; location: string; description: string }) => {
      return adminApi.createMenu({
        name: payload.name,
        location: payload.location,
        description: payload.description,
        isActive: true,
        items: [],
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'menus'] });
      setShowCreateModal(false);
      setNewMenuName('');
      setNewMenuDescription('');
      if (res?.data?.id) {
        setSelectedMenuId(res.data.id);
      }
      showToast('New menu created successfully! You can now add and configure visible items.');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to create menu', 'error');
    },
  });

  const deleteMenuMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminApi.deleteMenu(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'menus'] });
      setSelectedMenuId('main-header');
      setEditingItems(null);
      showToast('Menu deleted successfully');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to delete menu', 'error');
    },
  });

  // Toggle item visibility in local state
  const handleToggleVisibility = (index: number) => {
    if (!isSuperAdmin) {
      showToast('Only Super Admins can alter menu item visibility.', 'error');
      return;
    }
    const current = activeItems[index];
    if (!current) return;
    const updated = [...activeItems];
    updated[index] = {
      ...current,
      isVisible: !current.isVisible,
    };
    setEditingItems(updated);
  };

  // Reordering
  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!isSuperAdmin) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= activeItems.length) return;

    const updated = [...activeItems];
    const temp = updated[index];
    const targetItem = updated[target];
    if (!temp || !targetItem) return;
    updated[index] = targetItem;
    updated[target] = temp;

    // re-index order
    const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    setEditingItems(reordered);
  };

  // Delete item
  const handleDeleteItem = (index: number) => {
    if (!isSuperAdmin) return;
    const updated = activeItems.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, order: idx + 1 }));
    setEditingItems(updated);
  };

  // Open item modal for add/edit
  const handleOpenItemModal = (index?: number) => {
    if (!isSuperAdmin) {
      showToast('Super Admin access required to add or edit menu items.', 'error');
      return;
    }
    if (typeof index === 'number') {
      const item = activeItems[index];
      if (!item) return;
      setEditingItemIndex(index);
      setItemLabel(item.label);
      setItemHref(item.href);
      setItemIcon(item.icon || 'compass');
      setItemIsVisible(item.isVisible);
    } else {
      setEditingItemIndex(null);
      setItemLabel('');
      setItemHref('/');
      setItemIcon('compass');
      setItemIsVisible(true);
    }
    setShowAddItemModal(true);
  };

  // Save item from modal
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemLabel.trim() || !itemHref.trim()) {
      showToast('Please provide both label and link URL', 'error');
      return;
    }

    const updated = [...activeItems];
    if (editingItemIndex !== null) {
      const existing = updated[editingItemIndex];
      if (!existing) return;
      updated[editingItemIndex] = {
        ...existing,
        label: itemLabel.trim(),
        href: itemHref.trim(),
        icon: itemIcon.trim() || undefined,
        isVisible: itemIsVisible,
      };
    } else {
      updated.push({
        id: `item-${Date.now()}`,
        label: itemLabel.trim(),
        href: itemHref.trim(),
        icon: itemIcon.trim() || undefined,
        isVisible: itemIsVisible,
        order: updated.length + 1,
      });
    }

    setEditingItems(updated);
    setShowAddItemModal(false);
  };

  const handleSaveChanges = () => {
    if (!selectedMenu || !isSuperAdmin) return;
    updateMenuMutation.mutate({
      id: selectedMenu.id,
      items: activeItems,
    });
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto', color: 'var(--admin-text)' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            backgroundColor: toastMessage.type === 'error' ? '#ef4444' : '#10b981',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px 0' }}>Navigation Menus</h1>
          <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: 14 }}>
            Create custom menus and configure what links are visible across the platform.
          </p>
        </div>

        {isSuperAdmin && (
          <button style={btnPrimary} onClick={() => setShowCreateModal(true)}>
            <Icon name="plus" size={16} />
            <span>Create Menu</span>
          </button>
        )}
      </div>

      {isLoading && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--admin-text-muted)' }}>
          Loading navigation menus...
        </div>
      )}
      {error && (
        <div style={{ padding: 16, backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, marginBottom: 24 }}>
          Failed to load menus: {(error as Error).message}
        </div>
      )}

      {/* Role Banner */}
      <div
        style={{
          padding: '12px 18px',
          borderRadius: 8,
          marginBottom: 24,
          backgroundColor: isSuperAdmin ? '#10b98115' : '#f59e0b15',
          border: `1px solid ${isSuperAdmin ? '#10b98140' : '#f59e0b40'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="shield" size={18} color={isSuperAdmin ? '#10b981' : '#f59e0b'} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {isSuperAdmin
              ? 'Super Admin Privileges Active: You have full authority to create menus and toggle what links are visible.'
              : 'Read-Only Mode: Super Admin role is required to create menus or change visible links.'}
          </span>
        </div>
        <span
          style={{
            fontSize: 12,
            padding: '3px 8px',
            borderRadius: 4,
            fontWeight: 600,
            textTransform: 'uppercase',
            backgroundColor: isSuperAdmin ? '#10b98125' : '#f59e0b25',
            color: isSuperAdmin ? '#10b981' : '#f59e0b',
          }}
        >
          {user?.role || 'Guest'}
        </span>
      </div>

      {/* Menu Switcher Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--admin-surface)', paddingBottom: 12, marginBottom: 24, overflowX: 'auto' }}>
        {menus.map((m) => {
          const isSelected = selectedMenu?.id === m.id;
          const visibleCount = m.items?.filter((i) => i.isVisible).length || 0;
          return (
            <button
              key={m.id}
              onClick={() => {
                setSelectedMenuId(m.id);
                setEditingItems(null);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: isSelected ? 'var(--admin-surface)' : 'transparent',
                color: isSelected ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{m.name}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 10,
                  backgroundColor: isSelected ? 'var(--admin-primary)' : 'var(--admin-dark)',
                  color: isSelected ? '#fff' : 'var(--admin-text-muted)',
                }}
              >
                {visibleCount} visible
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Configuration Card */}
      {selectedMenu && (
        <div style={cardStyle}>
          {/* Card Title & Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{selectedMenu.name}</h2>
                <span
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor: 'var(--admin-dark)',
                    border: '1px solid var(--admin-surface)',
                    color: 'var(--admin-text-muted)',
                  }}
                >
                  Location: {selectedMenu.location}
                </span>
                {selectedMenu.isDefault && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 4,
                      backgroundColor: '#3b82f620',
                      color: '#60a5fa',
                      border: '1px solid #3b82f640',
                    }}
                  >
                    System Default
                  </span>
                )}
              </div>
              <p style={{ margin: '6px 0 0 0', color: 'var(--admin-text-muted)', fontSize: 13 }}>
                {selectedMenu.description || 'Configured menu links and visibility controls.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {isSuperAdmin && (
                <button style={btnSecondary} onClick={() => handleOpenItemModal()}>
                  <Icon name="plus" size={14} />
                  <span>Add Item</span>
                </button>
              )}
              {isSuperAdmin && editingItems !== null && (
                <button
                  style={btnPrimary}
                  onClick={handleSaveChanges}
                  disabled={updateMenuMutation.isPending}
                >
                  <Icon name="checkCircle" size={14} />
                  <span>{updateMenuMutation.isPending ? 'Saving…' : 'Save Changes'}</span>
                </button>
              )}
              {isSuperAdmin && !selectedMenu.isDefault && (
                <button
                  style={btnDanger}
                  onClick={async () => {
                    if (await confirm({ title: "Delete Menu", message: `Are you sure you want to delete menu "${selectedMenu.name}"?`, variant: "danger" })) {
                      deleteMenuMutation.mutate(selectedMenu.id);
                    }
                  }}
                >
                  <Icon name="trash" size={14} />
                  <span>Delete Menu</span>
                </button>
              )}
            </div>
          </div>

          {/* Visibility & Items List */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Menu Items ({activeItems.length} total, {activeItems.filter((i) => i.isVisible).length} visible)
              </span>
              {editingItems !== null && (
                <span style={{ fontSize: 12, color: 'var(--admin-primary)', fontWeight: 500 }}>
                  ● Unsaved changes
                </span>
              )}
            </div>

            <div style={{ border: '1px solid var(--admin-surface)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--admin-dark)', borderBottom: '1px solid var(--admin-surface)' }}>
                    <th style={{ padding: '12px 16px', width: 60 }}>Order</th>
                    <th style={{ padding: '12px 16px' }}>Label</th>
                    <th style={{ padding: '12px 16px' }}>Target Link</th>
                    <th style={{ padding: '12px 16px', width: 140 }}>Visibility</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: idx === activeItems.length - 1 ? 'none' : '1px solid var(--admin-surface)',
                        backgroundColor: item.isVisible ? 'transparent' : 'rgba(239, 68, 68, 0.04)',
                        opacity: item.isVisible ? 1 : 0.65,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)', fontWeight: 500 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Icon name={item.icon || 'compass'} size={16} color="var(--admin-primary)" />
                          <span>{item.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)', fontFamily: 'monospace', fontSize: 13 }}>
                        {item.href}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => handleToggleVisibility(idx)}
                          disabled={!isSuperAdmin}
                          title={isSuperAdmin ? (item.isVisible ? 'Click to hide link from menu' : 'Click to make link visible in menu') : 'Super Admin only'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: `1px solid ${item.isVisible ? '#10b98140' : '#ef444440'}`,
                            backgroundColor: item.isVisible ? '#10b98115' : '#ef444415',
                            color: item.isVisible ? '#10b981' : '#ef4444',
                            cursor: isSuperAdmin ? 'pointer' : 'not-allowed',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          <Icon name={item.isVisible ? 'eye' : 'eyeOff'} size={13} color={item.isVisible ? '#10b981' : '#ef4444'} />
                          <span>{item.isVisible ? 'Visible' : 'Hidden'}</span>
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {isSuperAdmin && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              onClick={() => handleMove(idx, 'up')}
                              disabled={idx === 0}
                              style={{ ...btnSecondary, padding: '4px 8px', opacity: idx === 0 ? 0.3 : 1 }}
                              title="Move Up"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleMove(idx, 'down')}
                              disabled={idx === activeItems.length - 1}
                              style={{ ...btnSecondary, padding: '4px 8px', opacity: idx === activeItems.length - 1 ? 0.3 : 1 }}
                              title="Move Down"
                            >
                              ▼
                            </button>
                            <button
                              onClick={() => handleOpenItemModal(idx)}
                              style={{ ...btnSecondary, padding: '4px 8px' }}
                              title="Edit Item"
                            >
                              <Icon name="edit" size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(idx)}
                              style={{ ...btnDanger, padding: '4px 8px' }}
                              title="Remove Item"
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {activeItems.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                        No items in this menu yet. Click "Add Item" to add navigation links.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Menu */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ backgroundColor: 'var(--admin-card)', borderRadius: 12, padding: 24, width: 440, maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}>Create New Menu</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newMenuName.trim()) return;
                createMenuMutation.mutate({
                  name: newMenuName.trim(),
                  location: newMenuLocation,
                  description: newMenuDescription.trim(),
                });
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Menu Name</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Footer Quick Links"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Location</label>
                <select
                  style={inputStyle}
                  value={newMenuLocation}
                  onChange={(e) => setNewMenuLocation(e.target.value)}
                >
                  <option value="header">Header (Top Navbar)</option>
                  <option value="profile">Profile Menu (Avatar Dropdown)</option>
                  <option value="footer">Footer</option>
                  <option value="mobile">Mobile Navigation</option>
                  <option value="custom">Custom Area</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Description (Optional)</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Navigation links for mobile app view"
                  value={newMenuDescription}
                  onChange={(e) => setNewMenuDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" style={btnSecondary} onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={btnPrimary} disabled={createMenuMutation.isPending}>
                  {createMenuMutation.isPending ? 'Creating…' : 'Create Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Item */}
      {showAddItemModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ backgroundColor: 'var(--admin-card)', borderRadius: 12, padding: 24, width: 440, maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}>
              {editingItemIndex !== null ? 'Edit Menu Item' : 'Add Menu Item'}
            </h3>
            <form onSubmit={handleSaveItem}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Item Label</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Live Events"
                  value={itemLabel}
                  onChange={(e) => setItemLabel(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Target URL / Path</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. /live"
                  value={itemHref}
                  onChange={(e) => setItemHref(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Icon</label>
                <select
                  style={inputStyle}
                  value={itemIcon}
                  onChange={(e) => setItemIcon(e.target.value)}
                >
                  <option value="compass">Compass (Browse)</option>
                  <option value="tv">TV / Broadcast</option>
                  <option value="theater">Theater (Reality)</option>
                  <option value="film">Film (Movies)</option>
                  <option value="smile">Smile (Comedy)</option>
                  <option value="sparkles">Sparkles (Creators)</option>
                  <option value="trophy">Trophy (Sports)</option>
                  <option value="music">Music</option>
                  <option value="gamepad">Gamepad (Games)</option>
                  <option value="gift">Gift (Rewards)</option>
                  <option value="wallet">Wallet</option>
                  <option value="settings">Settings</option>
                </select>
              </div>

              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="itemVisibleCheck"
                  checked={itemIsVisible}
                  onChange={(e) => setItemIsVisible(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="itemVisibleCheck" style={{ fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
                  Visible in Menu (uncheck to hide from user navigation)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" style={btnSecondary} onClick={() => setShowAddItemModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={btnPrimary}>
                  {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
