'use client';

import { useRouter } from 'next/navigation';

/**
 * End-state CTA after vertical content completion (AZP-VERT-007)
 * Shown when user finishes a vertical 9:16 video.
 * Provides contextual actions: follow creator, watch next, share, etc.
 */

export interface VerticalContent {
  id: string;
  title: string;
  creator: {
    id: string;
    name: string;
    avatar?: string;
    followerCount?: number;
  };
  universe: {
    id: string;
    name: string;
  };
  nextContentId?: string;
  nextContentTitle?: string;
}

interface VerticalEndCtaProps {
  content: VerticalContent;
  isFollowing: boolean;
  onFollow?: (creatorId: string) => void;
  onShare?: () => void;
  onRewatch?: () => void;
}

export function VerticalEndCta({ content, isFollowing, onFollow, onShare, onRewatch }: VerticalEndCtaProps) {
  const router = useRouter();

  const handleWatchNext = () => {
    if (content.nextContentId) {
      router.push(`/vertical/${content.nextContentId}`);
    }
  };

  const handleViewCreator = () => {
    router.push(`/creator/${content.creator.id}`);
  };

  const handleExploreUniverse = () => {
    router.push(`/browse?universe=${content.universe.id}`);
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end p-6">
      {/* Creator info */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleViewCreator} className="flex items-center gap-3">
          {content.creator.avatar ? (
            <img
              src={content.creator.avatar}
              alt={content.creator.name}
              className="w-12 h-12 rounded-full border-2 border-white"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {content.creator.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="text-left">
            <p className="text-white font-semibold">{content.creator.name}</p>
            {content.creator.followerCount && (
              <p className="text-gray-400 text-sm">
                {content.creator.followerCount.toLocaleString()} followers
              </p>
            )}
          </div>
        </button>

        <button
          onClick={() => onFollow?.(content.creator.id)}
          className={`ml-auto px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isFollowing
              ? 'bg-gray-700 text-white'
              : 'bg-white text-black hover:bg-gray-200'
          }`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {content.nextContentId && (
          <button
            onClick={handleWatchNext}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Watch Next
          </button>
        )}

        <button
          onClick={onRewatch}
          className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Rewatch
        </button>

        <button
          onClick={onShare}
          className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>

        <button
          onClick={handleExploreUniverse}
          className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Explore {content.universe.name}
        </button>
      </div>

      {/* Up next teaser */}
      {content.nextContentTitle && (
        <div className="text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Up Next</p>
          <p className="text-white font-medium text-sm">{content.nextContentTitle}</p>
        </div>
      )}
    </div>
  );
}
