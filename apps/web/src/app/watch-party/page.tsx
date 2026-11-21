'use client';

import { useState, useEffect } from 'react';
import { Users, Copy, Check, Send, Smile, Mic, MicOff, Video, Play, Share2 } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
}

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isMuted?: boolean;
}

interface RoomData {
  id: string;
  code: string;
  title: string;
  contentId?: string;
  playbackTime: number;
  isPlaying: boolean;
  participants: Participant[];
  messages: ChatMessage[];
}

export default function WatchPartyPage() {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [micMuted, setMicMuted] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<
    Array<{ id: number; emoji: string; left: number }>
  >([]);

  const roomCode = 'AZ-8492';

  useEffect(() => {
    let isMounted = true;
    async function loadRoom() {
      try {
        const res = await fetch(`/api/watch-party?code=${roomCode}`);
        const json = await res.json();
        if (json.success && isMounted) {
          setRoomData(json.data);
        }
      } catch (err) {
        console.error('Failed to load watch party:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRoom();
    return () => {
      isMounted = false;
    };
  }, [roomCode]);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !roomData) return;

    const currentMsg = message.trim();
    setMessage('');

    try {
      const res = await fetch('/api/watch-party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: roomCode,
          userName: 'You (Host)',
          message: currentMsg,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRoomData((prev) => (prev ? { ...prev, messages: [...prev.messages, json.data] } : null));
      }
    } catch (err) {
      console.error('Failed to post message:', err);
    }
  };

  const triggerReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const left = Math.floor(Math.random() * 80) + 10;
    setFloatingEmojis((prev) => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2500);
  };

  const participants = roomData?.participants || [];
  const messages = roomData?.messages || [];

  return (
    <PageShell>
      <div className="min-h-screen bg-az-surface-root text-az-ink pb-16 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-az-surface-panel border border-az-glass-border mb-6">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-az-success-400 animate-ping" />
            <div>
              <h1 className="font-extrabold text-white text-lg sm:text-xl flex items-center gap-2">
                {roomData?.title || 'Gidi Vice: Redline - Ep 1 Premiere'}
              </h1>
              <span className="text-xs text-az-ink-muted flex items-center gap-1.5 mt-0.5">
                <Users className="h-3.5 w-3.5 text-az-flame" />
                <span>{participants.length} viewers in synchronized watch room</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-az-glass-border font-mono text-xs text-az-flame font-bold">
              Room Code: {roomCode}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-lg bg-az-surface-panel border border-az-glass-border text-xs font-semibold text-white hover:bg-az-surface-panel/80 transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-az-success-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? 'Link Copied' : 'Invite'}</span>
            </button>
            <button
              type="button"
              className="p-2 rounded-lg bg-az-surface-panel border border-az-glass-border text-az-ink-muted hover:text-white transition-colors"
              title="Share Room"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Grid: Synced Video Player + Live Chat & Peers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Synchronized Screen */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border border-az-glass-border shadow-2xl flex items-center justify-center group">
              {/* Floating Live Reactions */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                {floatingEmojis.map((e) => (
                  <span
                    key={e.id}
                    className="absolute bottom-8 text-3xl animate-bounce transition-all duration-1000"
                    style={{ left: `${e.left}%` }}
                  >
                    {e.emoji}
                  </span>
                ))}
              </div>

              {/* Mock Synced Player */}
              <div className="text-center p-6">
                <div className="h-16 w-16 rounded-full bg-az-flame/20 border border-az-flame text-az-flame mx-auto flex items-center justify-center mb-3">
                  <Play className="h-8 w-8 fill-current translate-x-0.5" />
                </div>
                <h3 className="font-bold text-white text-base">Synchronized Playback Active</h3>
                <p className="text-xs text-az-ink-muted mt-1">
                  Host is streaming at 1080p • Audio synchronized via WebRTC
                </p>
              </div>

              {/* Bottom Control Strip */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4 flex items-center justify-between text-xs text-white">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMicMuted(!micMuted)}
                    className={`rounded-full p-2 transition-colors ${
                      micMuted
                        ? 'bg-az-error-500/80 text-white'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title={micMuted ? 'Unmute Mic' : 'Mute Mic'}
                  >
                    {micMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
                    title="Camera Video"
                  >
                    <Video className="h-4 w-4" />
                  </button>
                </div>

                {/* Instant Reactions Strip */}
                <div className="flex items-center gap-2">
                  {['🔥', '🍿', '😂', '🤯', '👏'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => triggerReaction(emoji)}
                      className="text-lg p-1.5 rounded-lg hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Participants Presence Strip */}
            <div className="p-4 rounded-xl bg-az-surface-panel border border-az-glass-border flex items-center gap-3 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-az-ink-muted uppercase tracking-wider whitespace-nowrap">
                In The Lounge:
              </span>
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-az-glass-border flex-shrink-0"
                >
                  <img src={p.avatar} alt={p.name} className="h-6 w-6 rounded-full object-cover" />
                  <span className="text-xs font-medium text-white">{p.name}</span>
                  {p.isMuted && <MicOff className="h-3 w-3 text-az-ink-muted" />}
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: Live Chat Room */}
          <div className="rounded-2xl border border-az-glass-border bg-az-surface-panel/60 flex flex-col h-[520px]">
            <div className="p-4 border-b border-az-glass-border flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Smile className="h-4 w-4 text-az-flame" />
                Live Party Chat
              </h3>
              <span className="text-[11px] text-az-ink-muted font-mono">Real-time DB</span>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 rounded-lg bg-az-surface-panel animate-pulse" />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-xs text-az-ink-muted py-8">
                  No messages yet. Say hello to the room!
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="text-xs">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <strong className="text-az-flame font-semibold">{m.user}</strong>
                      <span className="text-[10px] text-az-ink-muted font-mono">{m.time}</span>
                    </div>
                    <p className="text-az-ink bg-black/40 p-2 rounded-lg border border-az-glass-border/40">
                      {m.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-az-glass-border flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Say something to the room..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-az-surface-root border border-az-glass-border text-xs text-white placeholder-az-ink-dim focus:outline-none focus:border-az-flame transition-colors"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="p-2.5 rounded-xl bg-az-flame text-az-surface-root disabled:opacity-40 transition-opacity"
                title="Send Message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
