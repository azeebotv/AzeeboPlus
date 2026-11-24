'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useFlags } from '../../../context/FlagsContext';
import { apiFetch } from '../../../lib/api';
import { shouldAutoPlay } from '../../../lib/low-data';
import { useVideoPlayer } from '../../../hooks/useVideoPlayer';
import { detectMediaType } from '../../../lib/media-url';
import { announceToScreenReader } from '../../../lib/keyboard';
import { PageShell } from '@/components/layout/PageShell';
import { BranchingDecisionModal, type StoryBranchOption } from '@azeebo/ui/web';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  PictureInPicture,
  Settings,
  Maximize2,
  Minimize2,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Flag,
  X,
  Link2,
  TriangleAlert,
  Bird,
  Users,
  GitFork,
} from 'lucide-react';

interface Content {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration?: number;
  category?: string;
  universe?: { id: string; name: string };
  creator?: { id: string; name: string; avatar?: string };
  rating?: number;
  mediaUrl?: string;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  likes: number;
  likedByCurrentUser: boolean;
}

interface RawComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp?: string;
  createdAt?: string;
  likes: number;
  likedByCurrentUser: boolean;
}

export default function WatchPageClient({ id }: { id: string }): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { isEnabled } = useFlags();
  const [content, setContent] = useState<Content | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isDisliked, setIsDisliked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [, setDislikeCount] = useState<number>(0);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [showDescription, setShowDescription] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Interactive narrative decision branching state
  const [branchingModalOpen, setBranchingModalOpen] = useState<boolean>(false);
  const [decisionTriggered, setDecisionTriggered] = useState<boolean>(false);
  const [storyOptions] = useState<StoryBranchOption[]>([
    {
      id: 'opt-confront',
      label: 'Confront the Elder',
      description: 'Demand the truth about the forbidden divination at the shrine.',
      icon: '⚔️',
      targetEpisodeId: 'omi-ep2-branch-a',
    },
    {
      id: 'opt-river',
      label: 'Flee to the Sacred River',
      description: 'Seek sanctuary and hidden knowledge from the river deity.',
      icon: '🌊',
      targetEpisodeId: 'omi-ep2-branch-b',
    },
  ]);

  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount((c) => c + 1);
  }, []);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<HTMLDivElement>(null);

  const handleVideoEnded = useCallback(() => {
    announceToScreenReader('Video finished');
  }, []);

  const mediaUrlRef = useRef(content?.mediaUrl);
  mediaUrlRef.current = content?.mediaUrl;

  const handleVideoError = useCallback((errorMsg: string) => {
    // Ignore errors from useVideoPlayer for embedded media (YouTube/iframe/FTP)
    const mediaInfo = detectMediaType(mediaUrlRef.current || '');
    if (['youtube', 'iframe', 'ftp'].includes(mediaInfo.type)) return;
    setError(errorMsg);
  }, []);

  const {
    state: playerState,
    signedUrl,
    videoRef,
    play: playerPlay,
    pause: playerPause,
    seek: playerSeek,
    setVolume: playerSetVolume,
    toggleMute: playerToggleMute,
  } = useVideoPlayer({
    contentId: id,
    mediaUrl: content?.mediaUrl,
    // Autoplay is gated by the web_autoplay server flag (and low-data mode).
    autoPlay: shouldAutoPlay(isEnabled),
    onEnded: handleVideoEnded,
    onError: handleVideoError,
  });

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const isVerticalStory = Boolean(
    content?.universe?.name?.toLowerCase() === 'vertical' ||
    content?.category?.toLowerCase() === 'vertical' ||
    id.startsWith('omi-') ||
    id.includes('storyworld')
  );

  useEffect(() => {
    if (
      isVerticalStory &&
      !decisionTriggered &&
      playerState.duration > 20 &&
      playerState.currentTime >= playerState.duration - 15
    ) {
      setDecisionTriggered(true);
      playerPause();
      setBranchingModalOpen(true);
    }
  }, [
    isVerticalStory,
    decisionTriggered,
    playerState.currentTime,
    playerState.duration,
    playerPause,
  ]);

  const handleSelectStoryOption = useCallback(
    (option: StoryBranchOption) => {
      setBranchingModalOpen(false);
      if (option.targetEpisodeId) {
        router.push(`/watch/${option.targetEpisodeId}`);
      }
    },
    [router]
  );

  useEffect(() => {
    const fetchContent = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiFetch<
          Content & {
            creatorId?: string;
            creatorName?: string;
            creatorAvatar?: string;
            likeCount?: number;
            dislikeCount?: number;
          }
        >(`/content/${id}`, {}, { maxRetries: 2, timeoutMs: 10000 });
        if (response.success && response.data) {
          const data = response.data;
          const creatorId = data.creatorId || data.creator?.id || 'unknown';
          setContent({
            id: data.id || id,
            title: data.title || 'Untitled Content',
            description: data.description || 'No description available.',
            thumbnail: data.thumbnail || '/images/default-thumbnail.jpg',
            mediaUrl: data.mediaUrl || '',
            duration: data.duration || 0,
            category: data.category || 'General',
            universe: data.universe || { id: 'unknown', name: 'General' },
            creator: data.creator || {
              id: creatorId,
              name: data.creatorName || 'Unknown Creator',
              avatar: data.creatorAvatar || '/images/default-avatar.jpg',
            },
            rating: data.rating || 0,
          });
          setLikeCount(data.likeCount || 0);
          setDislikeCount(data.dislikeCount || 0);
          if (creatorId && creatorId !== 'unknown') {
            try {
              const creatorResponse = await apiFetch<{
                subscriberCount?: number;
                isSubscribed?: boolean;
                displayName?: string;
                name?: string;
                avatarUrl?: string;
                avatar?: string;
              }>(`/creators/${creatorId}`, {}, { maxRetries: 1, timeoutMs: 8000 });
              if (creatorResponse.success && creatorResponse.data) {
                const creatorData = creatorResponse.data;
                setSubscriberCount(creatorData.subscriberCount || 0);
                setIsSubscribed(creatorData.isSubscribed || false);
                setContent((prev) =>
                  prev
                    ? {
                        ...prev,
                        creator: {
                          id: creatorId,
                          name:
                            creatorData.displayName ||
                            creatorData.name ||
                            prev.creator?.name ||
                            'Unknown Creator',
                          avatar:
                            creatorData.avatarUrl ||
                            creatorData.avatar ||
                            prev.creator?.avatar ||
                            '/images/default-avatar.jpg',
                        },
                      }
                    : prev
                );
              }
            } catch {
              /* intentionally minimal */
            }
          }
        } else {
          setError('Content not found');
        }
      } catch {
        setError('Failed to load content. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchContent();
  }, [id, retryCount]);

  useEffect(() => {
    const loadComments = async (): Promise<void> => {
      try {
        const response = await apiFetch<RawComment[]>(
          `/content/${id}/comments`,
          {},
          { maxRetries: 1, timeoutMs: 8000 }
        );
        if (response.success && response.data) {
          const commentsData = Array.isArray(response.data) ? response.data : [];
          setComments(
            commentsData.map((c: RawComment) => ({
              id: String(c.id),
              userId: String(c.userId),
              userName: String(c.userName || 'Anonymous'),
              content: String(c.content),
              timestamp: new Date(c.timestamp || c.createdAt || ''),
              likes: Number(c.likes || 0),
              likedByCurrentUser: Boolean(c.likedByCurrentUser),
            }))
          );
        }
      } catch {
        /* intentionally minimal */
      }
    };
    if (id) loadComments();
  }, [id]);

  const togglePlay = useCallback((): void => {
    if (playerState.isPlaying) {
      playerPause();
      announceToScreenReader('Video paused');
    } else {
      playerPlay();
      announceToScreenReader('Video playing');
    }
  }, [playerState.isPlaying, playerPlay, playerPause]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const newVolume = parseFloat(e.target.value);
      playerSetVolume(newVolume);
      announceToScreenReader(`Volume: ${Math.round(newVolume * 100)}%`);
    },
    [playerSetVolume]
  );

  const toggleMute = useCallback((): void => {
    playerToggleMute();
    announceToScreenReader(playerState.isMuted ? 'Volume unmuted' : 'Volume muted');
  }, [playerToggleMute, playerState.isMuted]);

  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const newTime = parseFloat(e.target.value);
      playerSeek(newTime);
      announceToScreenReader(`Progress: ${formatTime(newTime)}`);
    },
    [playerSeek, formatTime]
  );

  const toggleFullscreen = useCallback(async (): Promise<void> => {
    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      /* intentionally minimal */
    }
  }, []);

  const togglePiP = useCallback(async (): Promise<void> => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      /* intentionally minimal */
    }
  }, [videoRef]);

  const changePlaybackRate = useCallback((rate: number): void => {
    setPlaybackRate(rate);
    setShowSettings(false);
    announceToScreenReader(`Playback speed: ${rate}x`);
  }, []);

  const toggleLike = useCallback((): void => {
    if (!user) return;
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    if (isDisliked) {
      setIsDisliked(false);
      setDislikeCount((prev) => prev - 1);
    }
    announceToScreenReader(isLiked ? 'Removed like' : 'Added like');
  }, [isLiked, isDisliked, user]);

  const toggleDislike = useCallback((): void => {
    if (!user) return;
    setIsDisliked(!isDisliked);
    setDislikeCount((prev) => (isDisliked ? prev - 1 : prev + 1));
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
    }
    announceToScreenReader(isDisliked ? 'Removed dislike' : 'Added dislike');
  }, [isDisliked, isLiked, user]);

  const toggleSubscribe = useCallback(async (): Promise<void> => {
    try {
      if (!user || !content?.creator?.id) return;
      const response = await apiFetch<{ subscribed: boolean }>(
        `/creators/subscribe/${content.creator.id}`,
        {
          method: 'POST',
        }
      );
      if (response.success) {
        setIsSubscribed(!isSubscribed);
        setSubscriberCount((prev) => (isSubscribed ? prev - 1 : prev + 1));
        announceToScreenReader(isSubscribed ? 'Unsubscribed' : 'Subscribed');
      }
    } catch {
      /* intentionally minimal */
    }
  }, [content?.creator?.id, isSubscribed, user]);

  const handleAddComment = useCallback(async (): Promise<void> => {
    if (!user || !newComment.trim()) return;
    try {
      const response = await apiFetch<Comment>(`/content/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment }),
      });
      if (response.success) {
        setNewComment('');
        const commentsResponse = await apiFetch<RawComment[]>(`/content/${id}/comments`);
        if (commentsResponse.success && commentsResponse.data) {
          const commentsData = Array.isArray(commentsResponse.data) ? commentsResponse.data : [];
          setComments(
            commentsData.map((c: RawComment) => ({
              id: String(c.id),
              userId: String(c.userId),
              userName: String(c.userName || 'Anonymous'),
              content: String(c.content),
              timestamp: new Date(c.timestamp || c.createdAt || ''),
              likes: Number(c.likes || 0),
              likedByCurrentUser: Boolean(c.likedByCurrentUser),
            }))
          );
        }
        announceToScreenReader('Comment added');
      }
    } catch {
      /* intentionally minimal */
    }
  }, [id, newComment, user]);

  const handleShare = useCallback(
    (platform: string): void => {
      const url = window.location.href;
      const text = `Check out ${content?.title} on Azeebo+`;
      switch (platform) {
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            '_blank'
          );
          break;
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            '_blank'
          );
          break;
        case 'copy':
          navigator.clipboard.writeText(url);
          announceToScreenReader('Link copied to clipboard');
          break;
      }
      setShowShareModal(false);
    },
    [content?.title]
  );

  const handleReport = useCallback(
    async (reason: string, details: string): Promise<void> => {
      try {
        setIsReporting(true);
        const response = await apiFetch<{ reported: boolean }>('/moderation/report', {
          method: 'POST',
          body: JSON.stringify({ targetId: id, targetType: 'content', reason, details }),
        });
        if (response.success) {
          setShowReportModal(false);
          announceToScreenReader('Report submitted successfully');
        }
      } catch {
        /* intentionally minimal */
      } finally {
        setIsReporting(false);
      }
    },
    [id]
  );

  const handleKeyboardNavigation = useCallback(
    (e: KeyboardEvent): void => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          playerSeek(Math.max(0, playerState.currentTime - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          playerSeek(Math.min(playerState.duration, playerState.currentTime + 10));
          break;
        case 'ArrowUp':
          e.preventDefault();
          playerSetVolume(Math.min(1, playerState.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          playerSetVolume(Math.max(0, playerState.volume - 0.1));
          break;
        case 'Escape':
          if (showShareModal) setShowShareModal(false);
          else if (showReportModal) setShowReportModal(false);
          break;
      }
    },
    [
      togglePlay,
      toggleFullscreen,
      toggleMute,
      playerSeek,
      playerSetVolume,
      playerState.currentTime,
      playerState.duration,
      playerState.volume,
      showShareModal,
      showReportModal,
    ]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => handleKeyboardNavigation(e);
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyboardNavigation]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const showControlsTemporarily = useCallback((): void => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      // Auto-hide controls
    }, 3000);
  }, []);

  const handleMouseMove = useCallback((): void => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleVideoClick = useCallback((): void => {
    togglePlay();
  }, [togglePlay]);

  if (isLoading) {
    return (
      <PageShell maxWidth="full">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="az-glass p-8 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 border-4 border-az-glass-border border-t-az-flame rounded-full animate-spin mx-auto mb-4" />
            <p className="az-body-strong mb-1 tracking-tight text-az-ink">
              Preparing Theater Stream
            </p>
            <p className="az-caption text-az-ink-muted">Buffering high-bitrate media feed...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !content) {
    return (
      <PageShell maxWidth="full">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="az-glass p-8 sm:p-10 text-center max-w-md w-full relative overflow-hidden">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-az-error-500/10 border border-az-error-500/20 flex items-center justify-center text-az-error-400">
              <TriangleAlert className="w-7 h-7" aria-hidden="true" />
            </div>
            <h2 className="az-title text-az-ink mb-2">Stream Error</h2>
            <p className="az-caption text-az-ink-muted mb-6 leading-relaxed">
              {error || 'Content not found'}
            </p>
            <button type="button" onClick={handleRetry} className="az-btn-primary tracking-wide">
              Retry Connection
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="7xl">
      <div
        ref={focusTrapRef}
        role="region"
        aria-label={`Watch ${content.title}`}
        className="py-6 sm:py-8 relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            {/* Video Container */}
            <div
              ref={videoContainerRef}
              className="relative w-full aspect-video bg-black rounded-az-panel overflow-hidden border border-az-glass-border shadow-az-lifted"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => playerState.isPlaying && null}
              onClick={(() => {
                const mediaInfo = detectMediaType(content?.mediaUrl || '');
                if (mediaInfo.type === 'youtube' || mediaInfo.type === 'iframe') return undefined;
                return handleVideoClick;
              })()}
              role="region"
              aria-label="Video player"
              tabIndex={0}
            >
              {(() => {
                const mediaInfo = detectMediaType(content.mediaUrl || '');
                if (mediaInfo.type === 'youtube' && mediaInfo.videoId) {
                  return (
                    <iframe
                      src={`https://www.youtube.com/embed/${mediaInfo.videoId}`}
                      title={content.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full rounded-az-card"
                    />
                  );
                }
                if (mediaInfo.type === 'iframe') {
                  return (
                    <iframe
                      src={mediaInfo.url}
                      title={content.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full rounded-az-card"
                    />
                  );
                }
                if (mediaInfo.type === 'ftp') {
                  return (
                    <div className="flex items-center justify-center h-full bg-az-surface-panel rounded-az-card">
                      <div className="text-center p-8">
                        <p className="text-az-ink text-lg mb-4">
                          This content is available via FTP
                        </p>
                        <a
                          href={mediaInfo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-az-scarlet hover:text-az-flame underline text-lg"
                        >
                          Download via FTP
                        </a>
                      </div>
                    </div>
                  );
                }
                if (signedUrl) {
                  return (
                    <video
                      ref={videoRef}
                      src={signedUrl}
                      className="w-full h-full object-contain"
                      playsInline
                      preload="metadata"
                    />
                  );
                }
                return content.thumbnail ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${content.thumbnail})` }}
                  >
                    <div className="absolute inset-0 bg-black/40" />
                  </div>
                ) : null;
              })()}
              {(() => {
                const mediaInfo = detectMediaType(content?.mediaUrl || '');
                const isEmbedded =
                  mediaInfo.type === 'youtube' ||
                  mediaInfo.type === 'iframe' ||
                  mediaInfo.type === 'ftp';
                return (
                  !isEmbedded &&
                  !playerState.isPlaying &&
                  !playerState.isLoading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlay();
                      }}
                      className="absolute inset-0 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-az-flame"
                      aria-label="Play video"
                    >
                      <div className="w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-110 bg-[image:var(--gradient-az-cta)]">
                        <Play
                          className="w-10 h-10 text-az-ink ml-1 fill-current"
                          aria-hidden="true"
                        />
                      </div>
                    </button>
                  )
                );
              })()}

              {/* Buffering Indicator */}
              {playerState.isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="w-16 h-16 border-4 border-az-ink/20 border-t-az-flame rounded-full animate-spin"></div>
                </div>
              )}

              {/* Video Controls - hidden for embedded media (YouTube/iframe has own controls) */}
              {!detectMediaType(content?.mediaUrl || '').type.match(/^(youtube|iframe)$/) && (
                <div className="absolute bottom-0 left-0 right-0 az-scrim--hero transition-opacity duration-300">
                  <div className="p-4">
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <input
                        type="range"
                        min="0"
                        max={playerState.duration || 100}
                        value={playerState.currentTime}
                        onChange={handleProgressChange}
                        className="w-full h-1 bg-az-ink/20 rounded-lg appearance-none cursor-pointer accent-az-flame focus-visible:outline-2 focus-visible:outline-az-flame"
                        aria-label="Video progress"
                      />
                      <div className="flex justify-between text-xs text-az-ink/60 mt-1">
                        <span>{formatTime(playerState.currentTime)}</span>
                        <span>{formatTime(playerState.duration || 100)}</span>
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlay();
                          }}
                          className="text-az-ink hover:text-az-flame transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-az-flame"
                          aria-label={playerState.isPlaying ? 'Pause' : 'Play'}
                        >
                          {playerState.isPlaying ? (
                            <Pause className="w-8 h-8" aria-hidden="true" />
                          ) : (
                            <Play className="w-8 h-8 fill-current" aria-hidden="true" />
                          )}
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMute();
                            }}
                            aria-pressed={playerState.isMuted}
                            className="text-az-ink hover:text-az-flame transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-az-flame"
                            aria-label={playerState.isMuted ? 'Unmute' : 'Mute'}
                          >
                            {playerState.isMuted || playerState.volume === 0 ? (
                              <VolumeX className="w-5 h-5" aria-hidden="true" />
                            ) : (
                              <Volume2 className="w-5 h-5" aria-hidden="true" />
                            )}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={playerState.isMuted ? 0 : playerState.volume}
                            onChange={handleVolumeChange}
                            className="w-20 h-1 bg-az-ink/20 rounded-lg appearance-none cursor-pointer accent-az-flame focus-visible:outline-2 focus-visible:outline-az-flame"
                            aria-label="Volume"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            changePlaybackRate(
                              playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1
                            );
                          }}
                          className="text-az-ink text-sm font-medium hover:text-az-flame transition-colors px-2 py-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-az-flame"
                          aria-label={`Playback speed: ${playbackRate}x`}
                        >
                          {playbackRate}x
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePiP();
                          }}
                          className="text-az-ink hover:text-az-flame transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-az-flame"
                          aria-label="Picture in Picture"
                        >
                          <PictureInPicture className="w-5 h-5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFullscreen();
                          }}
                          aria-pressed={isFullscreen}
                          className="text-az-ink hover:text-az-flame transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-az-flame"
                          aria-label="Toggle fullscreen"
                        >
                          {isFullscreen ? (
                            <Minimize2 className="w-5 h-5" aria-hidden="true" />
                          ) : (
                            <Maximize2 className="w-5 h-5" aria-hidden="true" />
                          )}
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowSettings(!showSettings);
                            }}
                            aria-expanded={showSettings}
                            className="text-az-ink hover:text-az-flame transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-az-flame"
                            aria-label="Settings"
                          >
                            <Settings className="w-5 h-5" aria-hidden="true" />
                          </button>
                          {showSettings && (
                            <div
                              className="absolute bottom-10 right-0 az-glass p-3 min-w-[160px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="text-xs font-bold text-az-ink/50 mb-2">
                                Playback Speed
                              </p>
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                <button
                                  key={rate}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    changePlaybackRate(rate);
                                  }}
                                  className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${playbackRate === rate ? 'text-az-flame' : 'text-az-ink/70 hover:text-az-ink hover:bg-az-glass-fill'}`}
                                >
                                  {rate}x
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Title Overlay */}
              {!playerState.isPlaying && (
                <div className="absolute top-4 left-4 right-4">
                  <h1 className="az-headline text-xl text-az-ink">{content.title}</h1>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="mt-4">
              <h1 className="az-headline text-xl text-az-ink">{content.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-az-ink/60">
                <span>{likeCount.toLocaleString()} likes</span>
                <span>{content.duration ? `${Math.floor(content.duration / 60)} min` : 'N/A'}</span>
              </div>
            </div>

            {/* Creator Info & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 py-4 border-t border-b border-az-glass-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-az-ink bg-[image:var(--gradient-az-cta)]">
                  {content.creator?.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="font-medium text-az-ink text-sm">{content.creator?.name}</h3>
                  <p className="text-xs text-az-ink/50">
                    {subscriberCount.toLocaleString()} subscribers
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleLike}
                  aria-pressed={isLiked}
                  aria-label="Like"
                  className={`flex items-center gap-2 px-4 py-2 rounded-az-pill text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-az-flame ${
                    isLiked
                      ? 'az-cta-small'
                      : 'border border-az-glass-border-hover text-az-ink/60 hover:text-az-ink'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" aria-hidden="true" />
                  {likeCount.toLocaleString()}
                </button>
                <button
                  type="button"
                  onClick={toggleDislike}
                  aria-pressed={isDisliked}
                  aria-label="Dislike"
                  className={`flex items-center gap-2 px-4 py-2 rounded-az-pill text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-az-flame ${
                    isDisliked
                      ? 'bg-az-ink/10 text-az-ink'
                      : 'border border-az-glass-border-hover text-az-ink/60 hover:text-az-ink'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-az-pill text-sm font-medium text-az-ink/60 hover:text-az-ink border border-az-glass-border-hover transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-az-flame"
                >
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                  Share
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-az-pill text-sm font-medium text-az-ink/60 hover:text-az-ink border border-az-glass-border-hover transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-az-flame"
                >
                  <Flag className="w-4 h-4" aria-hidden="true" />
                  Report
                </button>
                {isVerticalStory && (
                  <button
                    type="button"
                    onClick={() => {
                      playerPause();
                      setBranchingModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-az-pill text-sm font-bold text-az-warning-400 bg-az-warning-500/15 border border-az-warning-500/30 hover:bg-az-warning-500/25 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-az-warning-500"
                    aria-label="Story Branches"
                  >
                    <GitFork className="w-4 h-4" aria-hidden="true" />
                    Story Branches
                  </button>
                )}
                {content.creator?.id && (
                  <button
                    type="button"
                    onClick={toggleSubscribe}
                    aria-pressed={isSubscribed}
                    className={`flex items-center gap-2 px-4 py-2 rounded-az-pill text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-az-flame ${
                      isSubscribed ? 'border border-az-glass-border text-az-ink' : 'az-cta-small'
                    }`}
                  >
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowDescription(!showDescription)}
                aria-expanded={showDescription}
                className="flex items-center justify-between w-full p-3 rounded-az-card border border-az-glass-border text-left transition-colors hover:bg-az-glass-fill"
              >
                <div>
                  <span className="text-sm text-az-ink/50 ml-2">
                    {content.category || 'Uncategorized'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-az-ink/60 transition-transform ${showDescription ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {showDescription && (
                <div className="mt-3 p-3 rounded-az-card bg-az-ink/5 border border-az-ink/10">
                  <p className="text-sm text-az-ink/70 whitespace-pre-wrap">
                    {content.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-az-chip bg-az-scarlet/15 text-az-flame">
                      {content.universe?.name}
                    </span>
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-az-chip bg-az-ink/10 text-az-ink">
                      {content.category}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="lg:col-span-1">
            <div
              ref={commentsRef}
              role="region"
              aria-label="Comments section"
              className="az-glass p-5 sm:p-6"
            >
              <h2 className="az-title text-az-ink mb-4">Community Reactions ({comments.length})</h2>

              {/* Add Comment */}
              {user && (
                <div className="mb-6 pb-4 border-b border-az-ink/10">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-az-ink flex-shrink-0 bg-[image:var(--gradient-az-cta)]">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full bg-transparent text-az-ink placeholder-az-ink/30 resize-none border-none outline-none text-sm"
                        rows={3}
                        aria-label="Add a comment"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="az-btn-primary az-btn-primary--inline az-btn-primary--sm"
                        >
                          Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4" role="list" aria-label="Comments list">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="az-caption text-az-ink-muted">
                      No comments yet. Be the first to comment!
                    </p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} role="listitem" className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-az-ink flex-shrink-0 bg-[image:var(--gradient-az-cta)]">
                        {comment.userName?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-az-ink">
                            {comment.userName}
                          </span>
                          <span className="text-xs text-az-ink/40">
                            {new Date(comment.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-az-ink/70 mt-1">{comment.content}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setComments((prev) =>
                                prev.map((c) =>
                                  c.id === comment.id ? { ...c, likes: (c.likes || 0) + 1 } : c
                                )
                              );
                            }}
                            className="flex items-center gap-1 text-xs text-az-ink/40 hover:text-az-ink transition-colors"
                            aria-label={`Like comment, ${comment.likes} likes`}
                          >
                            <ThumbsUp className="w-3 h-3" aria-hidden="true" />
                            {comment.likes}
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewComment(`@${comment.userName} `)}
                            className="text-xs text-az-ink/40 hover:text-az-ink transition-colors"
                            aria-label={`Reply to ${comment.userName}`}
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Share content"
          tabIndex={-1}
          ref={(node) => {
            if (node) {
              const focusable = node.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
              );
              if (focusable.length > 0 && !node.contains(document.activeElement)) {
                focusable[0].focus();
              }
            }
          }}
          onClick={() => setShowShareModal(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowShareModal(false);
            if (e.key === 'Tab') {
              const focusable = e.currentTarget.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
              );
              if (focusable.length === 0) return;
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
              }
            }
          }}
        >
          <div className="az-glass p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="az-title text-az-ink">Share</h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-az-ink/40 hover:text-az-ink transition-colors"
                aria-label="Close share dialog"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleShare('twitter')}
                className="az-btn-social"
                aria-label="Share on Twitter"
              >
                <Bird className="w-5 h-5" aria-hidden="true" />
                Twitter
              </button>
              <button
                type="button"
                onClick={() => handleShare('facebook')}
                className="az-btn-social"
                aria-label="Share on Facebook"
              >
                <Users className="w-5 h-5" aria-hidden="true" />
                Facebook
              </button>
              <button
                type="button"
                onClick={() => handleShare('copy')}
                className="az-btn-social col-span-2"
              >
                <Link2 className="w-5 h-5" aria-hidden="true" />
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Report content"
        >
          <div className="az-glass p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="az-title text-az-ink">Report Content</h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-az-ink/40 hover:text-az-ink transition-colors"
                aria-label="Close report dialog"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleReport('inappropriate', '');
              }}
            >
              <div className="space-y-3 mb-6">
                {[
                  'Inappropriate content',
                  'Spam or misleading',
                  'Harassment or bullying',
                  'Copyright infringement',
                  'Other',
                ].map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-3 p-3 rounded-az-card border border-az-glass-border cursor-pointer hover:bg-az-glass-fill transition-colors"
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={reason}
                      className="w-4 h-4 accent-az-flame"
                      required
                    />
                    <span className="text-sm text-az-ink">{reason}</span>
                  </label>
                ))}
              </div>
              <button type="submit" disabled={isReporting} className="az-btn-primary">
                {isReporting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Storyworld Interactive Branching Decision Modal */}
      <BranchingDecisionModal
        isOpen={branchingModalOpen}
        title="Choose Your Story Path"
        prompt="A crucial narrative divergence has been unlocked! Select your character's action before time expires:"
        options={storyOptions}
        countdownSeconds={15}
        onSelectOption={handleSelectStoryOption}
        onTimeout={() => {
          if (storyOptions.length > 0) {
            handleSelectStoryOption(storyOptions[0]);
          }
        }}
      />
    </PageShell>
  );
}
