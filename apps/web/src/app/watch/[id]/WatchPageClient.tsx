'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useFlags } from '../../../context/FlagsContext';
import { apiFetch } from '../../../lib/api';
import { shouldAutoPlay } from '../../../lib/low-data';
import { useVideoPlayer } from '../../../hooks/useVideoPlayer';
import { detectMediaType } from '../../../lib/media-url';
import { announceToScreenReader } from '../../../lib/keyboard';
import AppHeader from '../../../components/layout/AppHeader';
import AppFooter from '../../../components/layout/AppFooter';

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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/10 border-t-[var(--brand-orange)] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60">Loading content...</p>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="az-glass p-8 text-center max-w-md">
            <span className="text-4xl mb-4 block">&#x26A0;&#xFE0F;</span>
            <h2 className="text-xl font-bold text-white mb-2">Error Loading Content</h2>
            <p className="text-white/50">{error || 'Content not found'}</p>
            <button
              onClick={handleRetry}
              className="az-btn-primary mt-6"
              style={{ width: 'auto', paddingInline: '2rem' }}
            >
              Try Again
            </button>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader />
      <div
        ref={focusTrapRef}
        role="main"
        aria-label={`Watch ${content.title}`}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            {/* Video Container */}
            <div
              ref={videoContainerRef}
              className="relative w-full bg-black rounded-xl overflow-hidden"
              style={{ aspectRatio: '16/9' }}
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
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${mediaInfo.videoId}`}
                      title={content.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                      style={{ aspectRatio: '16/9', borderRadius: '12px' }}
                    />
                  );
                }
                if (mediaInfo.type === 'iframe') {
                  return (
                    <iframe
                      width="100%"
                      height="100%"
                      src={mediaInfo.url}
                      title={content.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                      style={{ aspectRatio: '16/9', borderRadius: '12px' }}
                    />
                  );
                }
                if (mediaInfo.type === 'ftp') {
                  return (
                    <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg">
                      <div className="text-center p-8">
                        <p className="text-white text-lg mb-4">This content is available via FTP</p>
                        <a
                          href={mediaInfo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--brand-orange)] hover:text-[#FF6B35] underline text-lg"
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
                      style={{ aspectRatio: '16/9' }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlay();
                      }}
                      className="absolute inset-0 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--brand-orange)] focus:ring-offset-2 focus:ring-offset-black"
                      aria-label="Play video"
                    >
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                        style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                      >
                        <svg
                          className="w-10 h-10 text-white ml-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </button>
                  )
                );
              })()}

              {/* Buffering Indicator */}
              {playerState.isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="w-16 h-16 border-4 border-white/20 border-t-[var(--brand-orange)] rounded-full animate-spin"></div>
                </div>
              )}

              {/* Video Controls - hidden for embedded media (YouTube/iframe has own controls) */}
              {!detectMediaType(content?.mediaUrl || '').type.match(/^(youtube|iframe)$/) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300">
                  <div className="p-4">
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <input
                        type="range"
                        min="0"
                        max={playerState.duration || 100}
                        value={playerState.currentTime}
                        onChange={handleProgressChange}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--brand-orange)]"
                        aria-label="Video progress"
                      />
                      <div className="flex justify-between text-xs text-white/60 mt-1">
                        <span>{formatTime(playerState.currentTime)}</span>
                        <span>{formatTime(playerState.duration || 100)}</span>
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlay();
                          }}
                          className="text-white hover:text-[var(--brand-orange)] transition-colors"
                          aria-label={playerState.isPlaying ? 'Pause' : 'Play'}
                        >
                          {playerState.isPlaying ? (
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                          ) : (
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMute();
                            }}
                            className="text-white hover:text-[var(--brand-orange)] transition-colors"
                            aria-label={playerState.isMuted ? 'Unmute' : 'Mute'}
                          >
                            {playerState.isMuted || playerState.volume === 0 ? (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                              </svg>
                            )}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={playerState.isMuted ? 0 : playerState.volume}
                            onChange={handleVolumeChange}
                            className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--brand-orange)]"
                            aria-label="Volume"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            changePlaybackRate(
                              playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1
                            );
                          }}
                          className="text-white text-sm font-medium hover:text-[var(--brand-orange)] transition-colors px-2 py-1 rounded"
                          aria-label={`Playback speed: ${playbackRate}x`}
                        >
                          {playbackRate}x
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePiP();
                          }}
                          className="text-white hover:text-[var(--brand-orange)] transition-colors"
                          aria-label="Picture in Picture"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFullscreen();
                          }}
                          className="text-white hover:text-[var(--brand-orange)] transition-colors"
                          aria-label="Toggle fullscreen"
                        >
                          {isFullscreen ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                            </svg>
                          )}
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowSettings(!showSettings);
                            }}
                            className="text-white hover:text-[var(--brand-orange)] transition-colors"
                            aria-label="Settings"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41L9.25 5.35c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                            </svg>
                          </button>
                          {showSettings && (
                            <div
                              className="absolute bottom-10 right-0 az-glass p-3 min-w-[160px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="text-xs font-bold text-white/50 mb-2">Playback Speed</p>
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                <button
                                  key={rate}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    changePlaybackRate(rate);
                                  }}
                                  className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${playbackRate === rate ? 'text-[var(--brand-orange)]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
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
                  <h1 className="text-xl font-bold text-white">{content.title}</h1>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="mt-4">
              <h1 className="text-xl font-bold text-white">{content.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
                <span>{likeCount.toLocaleString()} likes</span>
                <span>{content.duration ? `${Math.floor(content.duration / 60)} min` : 'N/A'}</span>
              </div>
            </div>

            {/* Creator Info & Actions */}
            <div
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 py-4 border-t border-b"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                >
                  {content.creator?.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">{content.creator?.name}</h3>
                  <p className="text-xs text-white/50">
                    {subscriberCount.toLocaleString()} subscribers
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${isLiked ? 'text-white' : 'text-white/60 hover:text-white'}`}
                  style={
                    isLiked
                      ? { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }
                      : { border: '1px solid rgba(255,255,255,0.15)' }
                  }
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                  </svg>
                  {likeCount.toLocaleString()}
                </button>
                <button
                  onClick={toggleDislike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${isDisliked ? 'text-white' : 'text-white/60 hover:text-white'}`}
                  style={
                    isDisliked
                      ? { background: 'rgba(255,255,255,0.1)' }
                      : { border: '1px solid rgba(255,255,255,0.15)' }
                  }
                >
                  <svg className="w-4 h-4 rotate-180" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/60 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                  </svg>
                  Share
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/60 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
                  </svg>
                  Report
                </button>
                {content.creator?.id && (
                  <button
                    onClick={toggleSubscribe}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${isSubscribed ? 'text-white' : 'text-white'}`}
                    style={
                      isSubscribed
                        ? { border: '1px solid rgba(255,255,255,0.2)' }
                        : { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }
                    }
                  >
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="flex items-center justify-between w-full p-3 rounded-lg text-left transition-colors hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div>
                  <span className="text-sm text-white/50 ml-2">
                    {content.category || 'Uncategorized'}
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-white/60 transition-transform ${showDescription ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showDescription && (
                <div
                  className="mt-3 p-3 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <p className="text-sm text-white/70 whitespace-pre-wrap">{content.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded"
                      style={{ background: 'rgba(232,66,10,0.15)', color: 'var(--brand-orange)' }}
                    >
                      {content.universe?.name}
                    </span>
                    <span
                      className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--brand-white)' }}
                    >
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
              className="az-glass p-4"
            >
              <h2 className="text-lg font-bold text-white mb-4">Comments ({comments.length})</h2>

              {/* Add Comment */}
              {user && (
                <div
                  className="mb-6 pb-4 border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                    >
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full bg-transparent text-white placeholder-white/30 resize-none border-none outline-none text-sm"
                        rows={3}
                        aria-label="Add a comment"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="az-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            width: 'auto',
                            paddingInline: '1.5rem',
                            fontSize: '0.8rem',
                            padding: '0.5rem 1.5rem',
                          }}
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
                    <p className="text-white/50 text-sm">
                      No comments yet. Be the first to comment!
                    </p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} role="listitem" className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                      >
                        {comment.userName?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{comment.userName}</span>
                          <span className="text-xs text-white/40">
                            {new Date(comment.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-white/70 mt-1">{comment.content}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <button
                            className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
                            aria-label={`Like comment, ${comment.likes} likes`}
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                            </svg>
                            {comment.likes}
                          </button>
                          <button
                            className="text-xs text-white/40 hover:text-white transition-colors"
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
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Share content"
        >
          <div className="az-glass p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Share</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Close share dialog"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleShare('twitter')}
                className="az-glass flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors text-white font-medium text-sm"
                aria-label="Share on Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="az-glass flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors text-white font-medium text-sm"
                aria-label="Share on Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="az-glass flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors text-white font-medium text-sm col-span-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Report content"
        >
          <div className="az-glass p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Report Content</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Close report dialog"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
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
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={reason}
                      className="w-4 h-4 accent-[var(--brand-orange)]"
                      required
                    />
                    <span className="text-sm text-white">{reason}</span>
                  </label>
                ))}
              </div>
              <button
                type="submit"
                disabled={isReporting}
                className="az-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReporting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
