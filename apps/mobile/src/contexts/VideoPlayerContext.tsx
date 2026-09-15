/**
 * Global single-player context — the backbone of the PiP-style mini player.
 *
 * expo-video players are expensive and (for our purposes) singleton: the
 * watch screen and the comedy player both claim THIS provider's player
 * instance, so playback survives navigation. When the owning screen blurs
 * while playing, the provider schedules "mini mode": a draggable overlay
 * (MiniPlayerOverlay) keeps the video running over whatever screen the user
 * navigated to. Returning to the screen dismisses mini mode automatically
 * (or the user can expand it, navigating to the owner).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useVideoPlayer, type VideoPlayer } from 'expo-video';
import { logger } from '@azeebo/react-data/utils/logger';

export interface MiniPlayerState {
  /** Content currently loaded in the shared player. */
  contentId: string;
  /** Title shown on the mini surface. */
  title: string;
  /** Route that "owns" the video — where expand navigates. */
  ownerPath: string;
}

interface VideoPlayerContextValue {
  player: VideoPlayer;
  active: MiniPlayerState | null;
  /** Screen currently holding the player (its route key) or null. */
  holdingScreen: string | null;
  miniVisible: boolean;
  /** Source URL currently loaded into the shared player (skip re-replace). */
  loadedSource: string | null;
  /** Called by a player screen to claim the player for its content. */
  claimPlayer: (state: MiniPlayerState) => void;
  /** Called by the owning screen after replaceAsync resolves. */
  markSourceLoaded: (source: string) => void;
  /** Called on focus by the owning screen. */
  notifyScreenFocus: (screenKey: string) => void;
  /** Called on blur by the owning screen — may schedule mini mode. */
  notifyScreenBlur: (screenKey: string) => void;
  /** Hide the mini overlay (used by expand/close and by the owner on return). */
  dismissMini: () => void;
  /** Collapse the video into the mini overlay from a player screen. */
  minimize: () => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextValue | null>(null);

export function VideoPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const player = useVideoPlayer(null, (p) => {
    p.timeUpdateEventInterval = 1;
  });

  const [active, setActive] = useState<MiniPlayerState | null>(null);
  const [holdingScreen, setHoldingScreen] = useState<string | null>(null);
  const [miniVisible, setMiniVisible] = useState(false);
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  // Paused explicitly while hidden (mini close / replaced content) so the
  // provider never fights the user's intent to stop.
  const suppressed = useRef(false);

  const claimPlayer = useCallback((state: MiniPlayerState) => {
    suppressed.current = false;
    setActive((prev) => {
      if (prev?.contentId !== state.contentId) {
        logger.debug(`Shared player claimed for ${state.contentId}`);
      }
      return state;
    });
  }, []);

  const notifyScreenFocus = useCallback((screenKey: string) => {
    setHoldingScreen(screenKey);
    // Back on the owning screen: full-surface video, no overlay.
    setMiniVisible(false);
  }, []);

  const notifyScreenBlur = useCallback(
    (screenKey: string) => {
      setHoldingScreen((prev) => (prev === screenKey ? null : prev));
      // Mini mode only makes sense for content that is actively playing —
      // a paused video collapses back to a "resume card" instead. Read the
      // player's live state rather than a cached ref: a pause that lands a
      // frame before navigation would otherwise stale-trigger the overlay.
      if (!suppressed.current && active && player.playing) {
        setMiniVisible(true);
      }
    },
    [active, player]
  );

  // Track playing state outside the render path for imperative helpers.
  const playingRef = useRef(false);
  useEffect(() => {
    const sub = player.addListener('playingChange', (event) => {
      playingRef.current = event.isPlaying;
    });
    return () => sub.remove();
  }, [player]);

  const markSourceLoaded = useCallback((source: string) => {
    setLoadedSource(source);
  }, []);

  const dismissMini = useCallback(() => {
    setMiniVisible(false);
  }, []);

  const minimize = useCallback(() => {
    if (!playingRef.current) {
      // Expanding a paused video into a corner card is confusing; play first,
      // mirroring YouTube's minimize behavior.
      player.play();
    }
    setMiniVisible(true);
  }, [player]);

  const value = useMemo(
    () => ({
      player,
      active,
      holdingScreen,
      miniVisible,
      loadedSource,
      claimPlayer,
      markSourceLoaded,
      notifyScreenFocus,
      notifyScreenBlur,
      dismissMini,
      minimize,
    }),
    [
      player,
      active,
      holdingScreen,
      miniVisible,
      loadedSource,
      claimPlayer,
      markSourceLoaded,
      notifyScreenFocus,
      notifyScreenBlur,
      dismissMini,
      minimize,
    ]
  );

  return <VideoPlayerContext.Provider value={value}>{children}</VideoPlayerContext.Provider>;
}

export function useSharedVideoPlayer(): VideoPlayerContextValue {
  const ctx = useContext(VideoPlayerContext);
  if (!ctx) {
    throw new Error('useSharedVideoPlayer must be used within VideoPlayerProvider');
  }
  return ctx;
}
