'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import { Button, Card, Skeleton, Badge, Chip, Modal, Input, Select } from '@azeebo/ui';
import { colors } from '@azeebo/design-tokens';
import Link from 'next/link';
import { UploadIcon, Trash2Icon, EditIcon, EyeIcon } from 'lucide-react';
import type { ContentItem } from '@/lib/api';

export default function ContentPage(): JSX.Element {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    contentType: 'all',
    status: 'all',
    sort: 'newest',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'upload' | 'edit' | 'delete'>('upload');
  const [modalData, setModalData] = useState<any>(null);

  const fetchContent = async () => {
    let cancelled = false;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.content.getMyContent({
        limit: 20,
        offset: 0,
        contentType: filters.contentType === 'all' ? undefined : filters.contentType,
        status: filters.status === 'all' ? undefined : filters.status,
        sort: filters.sort as 'newest' | 'oldest' | 'popular' | 'trending' | undefined,
      });

      if (cancelled) return;

      if (response.success) {
        setContent(response.data?.items || []);
      } else {
        setError(response.message || 'Failed to load content');
        webLogger.error('Failed to load creator content', { error: response.message });
      }
    } catch (err) {
      if (cancelled) return;
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      webLogger.error('Failed to load creator content', { error: message });
    } finally {
      if (!cancelled) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    return () => {};
  }, [filters]);

  const handleFilterChange = (type: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [type]: value }));
  };

  const handleUpload = () => {
    setModalType('upload');
    setModalData(null);
    setModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setModalType('edit');
    setModalData(item);
    setModalOpen(true);
  };

  const handleDelete = (item: any) => {
    setModalType('delete');
    setModalData(item);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalType('upload');
    setModalData(null);
  };

  const handleModalSubmit = async (data: any) => {
    try {
      let response;
      if (modalType === 'upload') {
        response = await api.content.createContent(data);
      } else if (modalType === 'edit') {
        response = await api.content.updateContent(modalData.id, data);
      } else if (modalType === 'delete') {
        response = await api.content.deleteContent(modalData.id);
      } else {
        throw new Error(`Invalid modal type: ${modalType}`);
      }

      if (response && response.success) {
        setModalOpen(false);
        await fetchContent(); // Refresh content
        webLogger.log(`Content ${modalType} successful`, { id: modalData?.id });
      } else {
        setError(response?.message || `Failed to ${modalType} content`);
        webLogger.error(`Failed to ${modalType} content`, {
          error: response?.message || 'Unknown error',
          id: modalData?.id,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      webLogger.error(`Failed to ${modalType} content`, { error: message, id: modalData?.id });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
            My Content
          </h2>
          <Button variant="primary" onClick={handleUpload}>
            <UploadIcon className="mr-2 h-4 w-4" /> Upload New
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padding="none">
              <Skeleton height="200px" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
            My Content
          </h2>
          <Button variant="primary" onClick={handleUpload}>
            <UploadIcon className="mr-2 h-4 w-4" /> Upload New
          </Button>
        </div>

        <div className="text-center py-8">
          <p className="text-lg" style={{ color: colors.text.secondary }}>
            {error}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
          My Content
        </h2>
        <Button variant="primary" onClick={handleUpload}>
          <UploadIcon className="mr-2 h-4 w-4" /> Upload New
        </Button>
      </div>

      {/* Filters */}
      <Card padding="none" className="bg-gray-50">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.text.primary }}
              >
                Content Type
              </label>
              <Select
                value={filters.contentType}
                onChange={(e) => handleFilterChange('contentType', e.target.value)}
                options={[
                  { label: 'All Types', value: 'all' },
                  { label: 'Video', value: 'video' },
                  { label: 'Audio', value: 'audio' },
                  { label: 'Image', value: 'image' },
                  { label: 'Text', value: 'text' },
                  { label: 'Live', value: 'live' },
                ]}
                placeholder="Select type"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.text.primary }}
              >
                Status
              </label>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={[
                  { label: 'All Status', value: 'all' },
                  { label: 'Draft', value: 'draft' },
                  { label: 'Published', value: 'published' },
                  { label: 'Scheduled', value: 'scheduled' },
                  { label: 'Archived', value: 'archived' },
                ]}
                placeholder="Select status"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.text.primary }}
              >
                Sort By
              </label>
              <Select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                options={[
                  { label: 'Latest First', value: 'latest' },
                  { label: 'Oldest First', value: 'oldest' },
                  { label: 'Most Views', value: 'views' },
                  { label: 'Most Likes', value: 'likes' },
                ]}
                placeholder="Sort by"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Content List */}
      {content.length > 0 ? (
        <div className="space-y-4">
          {content.map((item) => (
            <Card key={item.id} padding="none" className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-500">
                        {item.contentType?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium" style={{ color: colors.text.primary }}>
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-xs">
                          {item.contentType || 'Video'}
                        </Badge>
                        <Badge
                          variant={
                            item.status === 'published'
                              ? 'success'
                              : item.status === 'draft'
                                ? 'secondary'
                                : 'warning'
                          }
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <EyeIcon className="h-3 w-3" />{' '}
                        {((item as any).views ?? 0).toLocaleString()} views
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
                        {((item as any).likes ?? 0).toLocaleString()} likes
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 11-1.357 6.374A5.988 5.988 0 0013 18h-1.04A5.98 5.98 0 005 12h1.422a5.98 5.98 0 003.714 1.186A11.977 11.977 0 0112 5.672z"
                          />
                        </svg>
                        {((item as any).comments ?? 0).toLocaleString()} comments
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-xs" style={{ color: colors.text.secondary }}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                        <EditIcon className="h-3 w-3" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        className="text-error-500"
                      >
                        <Trash2Icon className="h-3 w-3" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg" style={{ color: colors.text.secondary }}>
            You haven't uploaded any content yet
          </p>
          <Button variant="primary" onClick={handleUpload}>
            <UploadIcon className="mr-2 h-4 w-4" /> Upload Your First Content
          </Button>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={handleModalClose}>
        <div className="modal-content">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>
              {modalType === 'upload'
                ? 'Upload New Content'
                : modalType === 'edit'
                  ? 'Edit Content'
                  : 'Delete Content'}
            </h3>
            <Button variant="ghost" size="sm" onClick={handleModalClose}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>

          {modalType === 'upload' || modalType === 'edit' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget as HTMLFormElement);
                const data = Object.fromEntries(formData.entries());
                handleModalSubmit(data);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    Title
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter content title"
                    value={modalData?.title || ''}
                    onChange={(e) => {
                      const data = { ...modalData, title: e.target.value };
                      setModalData(data);
                    }}
                    required
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    Description
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter content description"
                    value={modalData?.description || ''}
                    onChange={(e) => {
                      const data = { ...modalData, description: e.target.value };
                      setModalData(data);
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    Content Type
                  </label>
                  <Select
                    value={modalData?.contentType || 'video'}
                    onChange={(e) => {
                      const data = { ...modalData, contentType: e.target.value };
                      setModalData(data);
                    }}
                    options={[
                      { label: 'Video', value: 'video' },
                      { label: 'Audio', value: 'audio' },
                      { label: 'Image', value: 'image' },
                      { label: 'Text', value: 'text' },
                      { label: 'Live Stream', value: 'live' },
                    ]}
                    placeholder="Select content type"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    Upload File
                  </label>
                  <Input
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.files && target.files[0]) {
                        const data = { ...modalData, file: target.files[0] };
                        setModalData(data);
                      }
                    }}
                    required={modalType === 'upload'}
                  />
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <Button variant="outline" onClick={handleModalClose}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    {modalType === 'upload' ? 'Upload Content' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-lg">Are you sure you want to delete "{modalData?.title}"?</p>
              <p className="text-sm text-gray-500">This action cannot be undone.</p>
              <div className="flex items-center gap-3 mt-4">
                <Button variant="outline" onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleModalSubmit}>
                  Delete Permanently
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
