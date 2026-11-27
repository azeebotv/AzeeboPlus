'use client';
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { api, User, ContentItem } from '../../lib/api';
import { webLogger } from '@/lib/logger';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';

interface CreatorProfile extends User {
  contentCount?: number;
  subscriberCount?: number;
  bio?: string;
  /** The discover endpoint embeds raw subscription rows instead of a count. */
  subscriptions?: unknown[];
}

export default function CreatorsPage(): React.JSX.Element {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);
  const [creatorContent, setCreatorContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isContentLoading, setIsContentLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreators = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const response = await api.creator.getCreators(1, 20);
        if (response.success) {
          // The discover endpoint returns a bare array; older envelopes used
          // { items }. Unwrap either shape — a bare array must not fall into
          // the empty state when records exist.
          const payload = response.data as unknown;
          const list = Array.isArray(payload)
            ? (payload as CreatorProfile[])
            : Array.isArray((payload as { items?: CreatorProfile[] } | null)?.items)
              ? (payload as { items: CreatorProfile[] }).items
              : [];
          setCreators(list);
        } else {
          setCreators([]);
        }
      } catch (error) {
        webLogger.error('Failed to load creators', error);
        setFetchError('Failed to load creators. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCreators();
  }, []);

  useEffect(() => {
    const fetchCreatorContent = async (): Promise<void> => {
      if (!selectedCreator) return;
      setIsContentLoading(true);
      try {
        const response = await api.creator.getCreatorContent(selectedCreator.id, 1, 10);
        if (response.success && response.data?.items) {
          setCreatorContent(response.data.items);
        } else {
          setCreatorContent([]);
        }
      } catch (error) {
        webLogger.error('Failed to load creator content', error);
      } finally {
        setIsContentLoading(false);
      }
    };
    fetchCreatorContent();
  }, [selectedCreator]);

  return (
    <PageShell activeNav="Creators" maxWidth="7xl">
      <PageHero
        eyebrow="Creators"
        title="Top Creators"
        subtitle="Discover amazing African content creators"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="az-glass flex animate-pulse flex-col items-center p-6">
              <div className="mb-4 size-24 rounded-full bg-az-glass-fill" />
              <div className="mb-2 h-4 w-3/4 rounded-az-control bg-az-glass-fill" />
              <div className="mb-4 h-3 w-1/2 rounded-az-control bg-az-glass-fill" />
              <div className="h-10 w-full rounded-az-pill bg-az-glass-fill" />
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <div className="py-16 text-center">
          <p className="az-lead mb-4 text-az-error-400">{fetchError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="az-btn-primary az-btn-primary--inline"
          >
            Try Again
          </button>
        </div>
      ) : creators.length === 0 ? (
        <div className="py-16 text-center">
          <Users size={48} className="mx-auto mb-4 text-az-flame" aria-hidden="true" />
          <h3 className="az-title mb-2 text-az-ink">No Creators Yet</h3>
          <p className="az-body text-az-ink-muted">
            Check back later for amazing content creators.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            role="group"
            aria-label="Creators"
          >
            {creators.map((creator) => {
              const isSelected = selectedCreator?.id === creator.id;
              return (
                <button
                  key={creator.id}
                  type="button"
                  onClick={() => setSelectedCreator(creator)}
                  aria-pressed={isSelected}
                  className={`rounded-az-feature border bg-az-glass-card p-6 text-center backdrop-blur-az-glass transition-all hover:scale-[1.02] ${
                    isSelected
                      ? 'border-az-flame shadow-az-glow'
                      : 'border-az-glass-border hover:border-az-glass-border-hover'
                  }`}
                >
                  <div className="az-heading mx-auto mb-4 flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-az-flame to-az-scarlet text-az-ink">
                    {creator.displayName?.charAt(0) || creator.name?.charAt(0) || 'C'}
                  </div>
                  <h3 className="az-subtitle text-az-ink">
                    {creator.displayName || creator.name || 'Creator'}
                  </h3>
                  <p className="az-body mb-1 text-az-ink-muted">
                    {creator.bio || `${creator.contentCount ?? 0} videos`}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-4">
                    <span className="az-caption text-az-ink-muted">
                      {creator.contentCount ?? 0} videos
                    </span>
                    <span className="az-caption text-az-ink-muted">
                      {creator.subscriberCount ?? creator.subscriptions?.length ?? 0} subscribers
                    </span>
                  </div>
                  {creator.bio && (
                    <p className="az-caption mt-3 line-clamp-2 text-az-ink-muted">{creator.bio}</p>
                  )}
                  <span className="az-btn-primary mt-4 block">View Profile</span>
                </button>
              );
            })}
          </div>

          {selectedCreator && isContentLoading && (
            <div className="flex items-center justify-center py-12">
              <span
                role="status"
                aria-label="Loading creator content"
                className="size-8 animate-spin rounded-full border-[3px] border-az-ink/10 border-t-az-flame"
              />
            </div>
          )}

          {selectedCreator && !isContentLoading && creatorContent.length > 0 && (
            <section>
              <h2 className="az-section-title mb-6 text-az-ink">
                {selectedCreator.displayName || selectedCreator.name || 'Creator'}&apos;s Content
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {creatorContent.map((content) => (
                  <a
                    key={content.id}
                    href={`/watch/${content.id}`}
                    className="az-glass block overflow-hidden"
                  >
                    <OptimizedImage
                      src={content.thumbnail}
                      alt={content.title}
                      width={400}
                      height={192}
                      className="h-48 w-full object-cover"
                    />
                    <div className="p-4">
                      <h3 className="az-body-strong truncate text-az-ink">{content.title}</h3>
                      <p className="az-caption mt-1 line-clamp-2 text-az-ink-muted">
                        {content.description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </PageShell>
  );
}
