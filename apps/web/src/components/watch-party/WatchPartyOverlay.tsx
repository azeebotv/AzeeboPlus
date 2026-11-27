'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Copy, X, Send, Link } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { pollingIntervals } from '@azeebo/design-tokens';

interface PartyParticipant {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string;
  role: 'host' | 'co-host' | 'member';
  isMuted: boolean;
}

interface PartyState {
  id: string;
  contentId: string;
  hostId: string;
  title: string;
  inviteCode: string;
  status: 'waiting' | 'playing' | 'paused' | 'ended';
  currentTime: number;
  isSyncing: boolean;
  maxParticipants: number;
  participantCount: number;
  participants: PartyParticipant[];
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  type: 'text' | 'system' | 'reaction';
  createdAt: string;
}

interface WatchPartyOverlayProps {
  contentId: string;
  contentTitle: string;
  isPlaying: boolean;
  currentTime: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
}

export function WatchPartyOverlay({
  contentId,
  contentTitle,
  isPlaying,
  currentTime,
  onPlayPause,
  onSeek,
}: WatchPartyOverlayProps): React.JSX.Element {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [activeParty, setActiveParty] = useState<PartyState | null>(null);

  // Fetch user's active parties
  useQuery({
    queryKey: ['watch-parties'],
    queryFn: async () => {
      const result = await apiFetch<PartyState[]>('/watch-parties/my');
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch active watch parties');
      }
      return result.data;
    },
  });

  // Fetch party details
  const partyQuery = useQuery({
    queryKey: ['watch-party', activeParty?.id],
    queryFn: async () => {
      if (!activeParty?.id) return null;
      const result = await apiFetch<PartyState>(`/watch-parties/${activeParty.id}`);
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch watch party details');
      }
      return result.data;
    },
    enabled: !!activeParty?.id,
    refetchInterval: pollingIntervals.live, // Poll for updates
  });

  // Fetch chat messages
  const chatQuery = useQuery({
    queryKey: ['watch-party-chat', activeParty?.id],
    queryFn: async () => {
      if (!activeParty?.id) return [];
      const result = await apiFetch<ChatMessage[]>(`/watch-parties/${activeParty.id}/chat`);
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch chat messages');
      }
      return result.data;
    },
    enabled: !!activeParty?.id && showChat,
    refetchInterval: pollingIntervals.realtime,
  });

  // Create party mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const result = await apiFetch('/watch-parties', {
        method: 'POST',
        body: JSON.stringify({ contentId, title: contentTitle }),
      });
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to create watch party');
      }
      return result;
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        setActiveParty(result.data as PartyState);
        setShowCreate(false);
        queryClient.invalidateQueries({ queryKey: ['watch-parties'] });
      }
    },
  });

  // Join party mutation
  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      const result = await apiFetch('/watch-parties/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode: code }),
      });
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to join watch party');
      }
      return result;
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        setActiveParty(result.data as PartyState);
        setShowJoin(false);
        setInviteCode('');
      }
    },
  });

  // Leave party mutation
  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!activeParty) return;
      const result = await apiFetch(`/watch-parties/${activeParty.id}/leave`, { method: 'POST' });
      if (!result.success) {
        throw new Error(result.message || 'Failed to leave watch party');
      }
      return result;
    },
    onSuccess: () => {
      setActiveParty(null);
      queryClient.invalidateQueries({ queryKey: ['watch-parties'] });
    },
  });

  // Update playback mutation
  const playbackMutation = useMutation({
    mutationFn: async (state: { isPlaying?: boolean; currentTime?: number }) => {
      if (!activeParty) return;
      const result = await apiFetch(`/watch-parties/${activeParty.id}/playback`, {
        method: 'POST',
        body: JSON.stringify(state),
      });
      if (!result.success) {
        throw new Error(result.message || 'Failed to update playback state');
      }
      return result;
    },
  });
  void playbackMutation; // Used in useEffect above

  // Send chat mutation
  const chatMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeParty) return;
      const result = await apiFetch(`/watch-parties/${activeParty.id}/chat`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      if (!result.success) {
        throw new Error(result.message || 'Failed to send message');
      }
      return result;
    },
    onSuccess: () => {
      setChatInput('');
      queryClient.invalidateQueries({ queryKey: ['watch-party-chat', activeParty?.id] });
    },
  });

  // Sync playback with party state
  useEffect(() => {
    if (partyQuery.data && user) {
      const party = partyQuery.data;
      const isHost = party.hostId === user.id;

      // If not host, sync to party state
      if (!isHost) {
        const shouldPlay = party.status === 'playing';
        if (shouldPlay !== isPlaying) {
          onPlayPause();
        }
        if (Math.abs(party.currentTime - currentTime) > 2) {
          onSeek(party.currentTime);
        }
      }
    }
  }, [partyQuery.data, user, isPlaying, currentTime, onPlayPause, onSeek]);

  // handlePlayPause moved to inline onClick

  // handleSeek moved to inline

  const copyInviteCode = useCallback(() => {
    if (activeParty) {
      navigator.clipboard.writeText(activeParty.inviteCode);
    }
  }, [activeParty]);

  const isHost = activeParty?.hostId === user?.id;

  return (
    <div className="relative">
      {/* Watch Party Button */}
      {!activeParty && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="az-btn-primary az-btn-primary--inline az-btn-primary--sm flex cursor-pointer items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Start Party
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="flex cursor-pointer items-center gap-2 rounded-az-card border border-az-ink/20 px-4 py-2 az-body-strong text-az-ink transition-colors"
          >
            <Link className="w-4 h-4" />
            Join Party
          </button>
        </div>
      )}

      {/* Active Party Bar */}
      {activeParty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-az-ink/10 bg-black/90 p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-az-success-500 animate-pulse" />
                <span className="text-sm font-medium text-az-ink">Watch Party</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-az-ink/60" />
                <span className="text-sm text-az-ink/60">{activeParty.participantCount}</span>
              </div>
              {isHost && (
                <span className="text-[10px] px-2 py-0.5 rounded-az-pill bg-az-warning-500/20 text-az-warning-400">
                  HOST
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Invite Code */}
              <button
                onClick={copyInviteCode}
                className="flex cursor-pointer items-center gap-1 rounded-az-control bg-az-ink/10 px-3 py-1.5 text-xs text-az-ink/60 transition-colors hover:text-az-ink"
              >
                <Copy className="w-3 h-3" />
                {activeParty.inviteCode}
              </button>

              {/* Chat Toggle */}
              <button
                onClick={() => setShowChat(!showChat)}
                className={`cursor-pointer rounded-az-control p-2 transition-colors ${
                  showChat
                    ? 'bg-az-flame text-az-surface-root'
                    : 'bg-az-ink/10 text-az-ink/60 hover:text-az-ink'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>

              {/* Leave */}
              <button
                onClick={() => leaveMutation.mutate()}
                className="cursor-pointer rounded-az-control bg-az-ink/10 p-2 text-az-ink/60 transition-colors hover:text-az-error-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Panel */}
          {showChat && (
            <div className="max-w-6xl mx-auto mt-4">
              <div className="max-h-[200px] overflow-hidden rounded-az-card bg-az-ink/5">
                <div className="max-h-[150px] p-3 space-y-2 overflow-y-auto">
                  {(chatQuery.data || []).map((msg) => (
                    <div key={msg.id} className="text-sm">
                      {msg.type === 'system' ? (
                        <span className="text-az-ink/30 italic">{msg.content}</span>
                      ) : (
                        <>
                          <span className="font-medium text-az-ink/80">{msg.userName}: </span>
                          <span className="text-az-ink/60">{msg.content}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 border-t border-az-ink/5 p-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && chatInput.trim()) {
                        chatMutation.mutate(chatInput.trim());
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-az-control border-none bg-az-ink/10 px-3 py-1.5 text-sm text-az-ink outline-none placeholder-white/30"
                  />
                  <button
                    onClick={() => {
                      if (chatInput.trim()) chatMutation.mutate(chatInput.trim());
                    }}
                    className="cursor-pointer rounded-az-control bg-az-flame p-1.5"
                  >
                    <Send className="w-4 h-4 text-az-ink" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Party Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="az-glass p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-az-ink mb-4">Start Watch Party</h3>
            <p className="text-sm text-az-ink/60 mb-4">
              Invite friends to watch together! Everyone&apos;s playback will be synchronized.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="az-btn-primary flex-1 cursor-pointer"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Party'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="cursor-pointer rounded-az-card border border-az-ink/20 px-4 py-2 text-sm font-medium text-az-ink/60 transition-colors hover:text-az-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Party Modal */}
      {showJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="az-glass p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-az-ink mb-4">Join Watch Party</h3>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter invite code"
              maxLength={8}
              className="w-full rounded-az-card border bg-az-ink/5 px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-az-ink outline-none placeholder-white/30 mb-4 border-az-ink/10 focus:border-az-flame"
            />
            <div className="flex gap-3">
              <button
                onClick={() => joinMutation.mutate(inviteCode)}
                disabled={inviteCode.length < 8 || joinMutation.isPending}
                className="az-btn-primary flex-1 cursor-pointer"
              >
                {joinMutation.isPending ? 'Joining...' : 'Join'}
              </button>
              <button
                onClick={() => {
                  setShowJoin(false);
                  setInviteCode('');
                }}
                className="cursor-pointer rounded-az-card border border-az-ink/20 px-4 py-2 text-sm font-medium text-az-ink/60 transition-colors hover:text-az-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
