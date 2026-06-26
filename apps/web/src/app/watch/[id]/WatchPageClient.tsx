'use client';
import React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../lib/api';
import { trapFocus, announceToScreenReader } from '../../../lib/keyboard';
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

export default function WatchPageClient({ id }: { id: string }): React.JSX.Element {
  const { user } = useAuth();
  const [content, setContent] = useState<Content | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isDisliked, setIsDisliked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [dislikeCount, setDislikeCount] = useState<number>(0);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [showDescription, setShowDescription] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPiP, setIsPiP] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [isReporting, setIsReporting] = useState<boolean>(false);

  const videoRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<HTMLDivElement>(null);

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
        const response = await apiFetch<any>(`/content/${id}`);
        if (response.success && response.data) {
          const data = response.data;
          setContent({
            id: data.id || id,
            title: data.title || 'Untitled Content',
            description: data.description || 'No description available.',
            thumbnail: data.thumbnail || '/images/default-thumbnail.jpg',
            duration: data.duration || 0,
            category: data.category || 'General',
            universe: data.universe || { id: 'unknown', name: 'General' },
            creator: data.creator || {
              id: 'unknown',
              name: 'Unknown Creator',
              avatar: '/images/default-avatar.jpg',
            },
            rating: data.rating || 0,
          });
          if (data.rating) {
            const fullStars = Math.floor(data.rating);
            const decimalPart = data.rating - fullStars;
            setLikeCount(Math.floor(decimalPart * 1000));
            setDislikeCount(Math.floor((1 - decimalPart) * 1000));
          }
          if (data.creator?.id) {
            try {
              const creatorResponse = await apiFetch<any>(`/creators/${data.creator.id}`);
              if (creatorResponse.success && creatorResponse.data) {
                setSubscriberCount(creatorResponse.data.subscriberCount || 0);
                setIsSubscribed(creatorResponse.data.isSubscribed || false);
              }
            } catch {
              /* intentionally minimal */
            }
          }
        } else {
          setError('Content not found');
        }
      } catch (err) {
        setError('Failed to load content. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchContent();
  }, [id]);

  useEffect(() => {
    const loadComments = async (): Promise<void> => {
      try {
        const response = await apiFetch<any>(`/content/${id}/comments`);
        if (response.success && response.data) {
          const commentsData = Array.isArray(response.data) ? response.data : [];
          setComments(
            commentsData.map((c: any) => ({
              id: String(c.id),
              userId: String(c.userId),
              userName: String(c.userName || 'Anonymous'),
              content: String(c.content),
              timestamp: new Date(c.timestamp || c.createdAt),
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

  const play = useCallback((): void => {
    if (!videoRef.current) return;
    setIsPlaying(true);
    videoRef.current.style.backgroundImage = `url(${content?.thumbnail || ''})`;
    videoRef.current.style.backgroundSize = 'cover';
    videoRef.current.style.backgroundPosition = 'center';
    announceToScreenReader('Video playing');
  }, [content?.thumbnail]);

  const pause = useCallback((): void => {
    setIsPlaying(false);
    announceToScreenReader('Video paused');
  }, []);

  const togglePlay = useCallback((): void => {
    isPlaying ? pause() : play();
  }, [isPlaying, pause, play]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    announceToScreenReader(`Volume: ${Math.round(newVolume * 100)}%`);
  }, []);

  const toggleMute = useCallback((): void => {
    setIsMuted(!isMuted);
    announceToScreenReader(isMuted ? 'Volume muted' : 'Volume unmuted');
  }, [isMuted]);

  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const newProgress = parseFloat(e.target.value);
      setProgress(newProgress);
      announceToScreenReader(`Progress: ${formatTime(newProgress)}`);
    },
    [formatTime]
  );

  const toggleFullscreen = useCallback(async (): Promise<void> => {
    try {
      if (!document.fullscreenElement) {
        await videoRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      /* intentionally minimal */
    }
  }, []);

  const togglePiP = useCallback(async (): Promise<void> => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else if (videoRef.current) {
        await (videoRef.current as unknown as HTMLVideoElement).requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (err) {
      /* intentionally minimal */
    }
  }, []);

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
      const response = await apiFetch<any>(`/creators/subscribe/${content.creator.id}`, {
        method: 'POST',
      });
      if (response.success) {
        setIsSubscribed(!isSubscribed);
        setSubscriberCount((prev) => (isSubscribed ? prev - 1 : prev + 1));
        announceToScreenReader(isSubscribed ? 'Unsubscribed' : 'Subscribed');
      }
    } catch (err) {
      /* intentionally minimal */
    }
  }, [content?.creator?.id, isSubscribed, user]);

  const handleAddComment = useCallback(async (): Promise<void> => {
    if (!user || !newComment.trim()) return;
    try {
      const response = await apiFetch<any>(`/content/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment }),
      });
      if (response.success) {
        setNewComment('');
        const commentsResponse = await apiFetch<any>(`/content/${id}/comments`);
        if (commentsResponse.success && commentsResponse.data) {
          const commentsData = Array.isArray(commentsResponse.data) ? commentsResponse.data : [];
          setComments(
            commentsData.map((c: any) => ({
              id: String(c.id),
              userId: String(c.userId),
              userName: String(c.userName || 'Anonymous'),
              content: String(c.content),
              timestamp: new Date(c.timestamp || c.createdAt),
              likes: Number(c.likes || 0),
              likedByCurrentUser: Boolean(c.likedByCurrentUser),
            }))
          );
        }
        announceToScreenReader('Comment added');
      }
    } catch (err) {
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
        const response = await apiFetch<any>('/moderation/report', {
          method: 'POST',
          body: JSON.stringify({ targetId: id, targetType: 'content', reason, details }),
        });
        if (response.success) {
          setShowReportModal(false);
          announceToScreenReader('Report submitted successfully');
        }
      } catch (err) {
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
          setProgress(Math.max(0, progress - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setProgress(Math.min(duration, progress + 10));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
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
      progress,
      duration,
      volume,
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
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  const handleMouseMove = useCallback((): void => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
        <AppHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/10 border-t-[#E8420A] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60">Loading content...</p>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
        <AppHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="az-glass p-8 text-center max-w-md">
            <span className="text-4xl mb-4 block">&#x26A0;&#xFE0F;</span>
            <h2 className="text-xl font-bold text-white mb-2">Error Loading Content</h2>
            <p className="text-white/50">{error || 'Content not found'}</p>
            <button
              onClick={() => window.location.reload()}
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
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
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
              ref={videoRef}
              className="relative w-full bg-black rounded-xl overflow-hidden"
              style={{ aspectRatio: '16/9' }}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => isPlaying && setShowControls(false)}
              onClick={togglePlay}
              role="region"
              aria-label="Video player"
              tabIndex={0}
            >
              {content.thumbnail && (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${content.thumbnail})` }}
                >
                  <div className="absolute inset-0 bg-black/40" />
                </div>
              )}

              {/* Play Button Overlay */}
              {!isPlaying && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    play();
                  }}
                  className="absolute inset-0 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#E8420A] focus:ring-offset-2 focus:ring-offset-black"
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
              )}

              {/* Buffering Indicator */}
              {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="w-16 h-16 border-4 border-white/20 border-t-[#E8420A] rounded-full animate-spin"></div>
                </div>
              )}

              {/* Video Controls */}
              <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
              >
                <div className="p-4">
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={progress}
                      onChange={handleProgressChange}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#E8420A]"
                      aria-label="Video progress"
                    />
                    <div className="flex justify-between text-xs text-white/60 mt-1">
                      <span>{formatTime(progress)}</span>
                      <span>{formatTime(duration || 100)}</span>
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
                        className="text-white hover:text-[#E8420A] transition-colors"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? (
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
                          className="text-white hover:text-[#E8420A] transition-colors"
                          aria-label={isMuted ? 'Unmute' : 'Mute'}
                        >
                          {isMuted || volume === 0 ? (
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
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#E8420A]"
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
                        className="text-white text-sm font-medium hover:text-[#E8420A] transition-colors px-2 py-1 rounded"
                        aria-label={`Playback speed: ${playbackRate}x`}
                      >
                        {playbackRate}x
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePiP();
                        }}
                        className="text-white hover:text-[#E8420A] transition-colors"
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
                        className="text-white hover:text-[#E8420A] transition-colors"
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
                          className="text-white hover:text-[#E8420A] transition-colors"
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
                                className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${playbackRate === rate ? 'text-[#E8420A]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
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

              {/* Title Overlay */}
              {!isPlaying && (
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
                  <span className="text-sm font-medium text-white">
                    {content.category || 'Uncategorized'}
                  </span>
                  <span className="text-sm text-white/50 ml-2">
                    {formatTime(duration || 100)} views
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
                      style={{ background: 'rgba(232,66,10,0.15)', color: '#E8420A' }}
                    >
                      {content.universe?.name}
                    </span>
                    <span
                      className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}
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
                          <button className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                            </svg>
                            {comment.likes}
                          </button>
                          <button className="text-xs text-white/40 hover:text-white transition-colors">
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
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="az-glass flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors text-white font-medium text-sm"
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
                      className="w-4 h-4 accent-[#E8420A]"
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
