'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Copy, X, Send, Link } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

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
      return result.success ? result.data || [] : [];
    },
  });

  // Fetch party details
  const partyQuery = useQuery({
    queryKey: ['watch-party', activeParty?.id],
    queryFn: async () => {
      if (!activeParty?.id) return null;
      const result = await apiFetch<PartyState>(`/watch-parties/${activeParty.id}`);
      return result.success ? result.data : null;
    },
    enabled: !!activeParty?.id,
    refetchInterval: 2000, // Poll for updates
  });

  // Fetch chat messages
  const chatQuery = useQuery({
    queryKey: ['watch-party-chat', activeParty?.id],
    queryFn: async () => {
      if (!activeParty?.id) return [];
      const result = await apiFetch<ChatMessage[]>(`/watch-parties/${activeParty.id}/chat`);
      return result.success ? result.data || [] : [];
    },
    enabled: !!activeParty?.id && showChat,
    refetchInterval: 1000,
  });

  // Create party mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      return apiFetch('/watch-parties', {
        method: 'POST',
        body: JSON.stringify({ contentId, title: contentTitle }),
      });
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
      return apiFetch('/watch-parties/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode: code }),
      });
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
      return apiFetch(`/watch-parties/${activeParty.id}/leave`, { method: 'POST' });
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
      return apiFetch(`/watch-parties/${activeParty.id}/playback`, {
        method: 'POST',
        body: JSON.stringify(state),
      });
    },
  });
  void playbackMutation; // Used in useEffect above

  // Send chat mutation
  const chatMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeParty) return;
      return apiFetch(`/watch-parties/${activeParty.id}/chat`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'var(--brand-orange)', color: 'white' }}
          >
            <Users className="w-4 h-4" />
            Start Party
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
          >
            <Link className="w-4 h-4" />
            Join Party
          </button>
        </div>
      )}

      {/* Active Party Bar */}
      {activeParty && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 p-4"
          style={{ background: 'rgba(0,0,0,0.9)', borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-white">Watch Party</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-white/60" />
                <span className="text-sm text-white/60">{activeParty.participantCount}</span>
              </div>
              {isHost && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                  HOST
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Invite Code */}
              <button
                onClick={copyInviteCode}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <Copy className="w-3 h-3" />
                {activeParty.inviteCode}
              </button>

              {/* Chat Toggle */}
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-2 rounded-lg transition-colors ${showChat ? 'text-white' : 'text-white/60 hover:text-white'}`}
                style={{ background: showChat ? 'var(--brand-orange)' : 'rgba(255,255,255,0.1)' }}
              >
                <Send className="w-4 h-4" />
              </button>

              {/* Leave */}
              <button
                onClick={() => leaveMutation.mutate()}
                className="p-2 rounded-lg text-white/60 hover:text-red-400 transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Panel */}
          {showChat && (
            <div className="max-w-6xl mx-auto mt-4">
              <div
                className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)', maxHeight: 200 }}
              >
                <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 150 }}>
                  {(chatQuery.data || []).map((msg) => (
                    <div key={msg.id} className="text-sm">
                      {msg.type === 'system' ? (
                        <span className="text-white/30 italic">{msg.content}</span>
                      ) : (
                        <>
                          <span className="font-medium text-white/80">{msg.userName}: </span>
                          <span className="text-white/60">{msg.content}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div
                  className="flex gap-2 p-2"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                >
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
                    className="flex-1 px-3 py-1.5 rounded-lg text-sm text-white placeholder-white/30 border-none outline-none"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  />
                  <button
                    onClick={() => {
                      if (chatInput.trim()) chatMutation.mutate(chatInput.trim());
                    }}
                    className="p-1.5 rounded-lg"
                    style={{ background: 'var(--brand-orange)' }}
                  >
                    <Send className="w-4 h-4 text-white" />
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
            <h3 className="text-lg font-bold text-white mb-4">Start Watch Party</h3>
            <p className="text-sm text-white/60 mb-4">
              Invite friends to watch together! Everyone&apos;s playback will be synchronized.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="flex-1 py-2 px-4 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--brand-orange)' }}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Party'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="py-2 px-4 rounded-xl text-sm font-medium text-white/60 border hover:text-white transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.2)' }}
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
            <h3 className="text-lg font-bold text-white mb-4">Join Watch Party</h3>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter invite code"
              maxLength={8}
              className="w-full px-4 py-3 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-white placeholder-white/30 border outline-none focus:border-[var(--brand-orange)] mb-4"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => joinMutation.mutate(inviteCode)}
                disabled={inviteCode.length < 8 || joinMutation.isPending}
                className="flex-1 py-2 px-4 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--brand-orange)' }}
              >
                {joinMutation.isPending ? 'Joining...' : 'Join'}
              </button>
              <button
                onClick={() => {
                  setShowJoin(false);
                  setInviteCode('');
                }}
                className="py-2 px-4 rounded-xl text-sm font-medium text-white/60 border hover:text-white transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.2)' }}
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
