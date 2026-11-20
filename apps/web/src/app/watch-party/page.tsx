'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Copy, Check, Send, Smile, Mic, MicOff, Video, Play, Share2 } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  time: string;
  isHost?: boolean;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'Tolu_Lagos',
    avatar: '🦁',
    text: 'Yo that plot twist in scene 4 was insane!! 😱',
    time: '20:14',
    isHost: true,
  },
  {
    id: 'm2',
    sender: 'Kemi_W',
    avatar: '✨',
    text: 'I knew the uncle was the real mastermind lol',
    time: '20:15',
  },
  {
    id: 'm3',
    sender: 'Emeka_007',
    avatar: '🦅',
    text: 'Soundtrack hits different on Dolby Atmos 🔥🍿',
    time: '20:15',
  },
];

const PARTICIPANTS = [
  { name: 'Tolu (Host)', avatar: '🦁', isHost: true },
  { name: 'Kemi', avatar: '✨' },
  { name: 'Emeka', avatar: '🦅' },
  { name: 'Zainab', avatar: '👑' },
  { name: 'David', avatar: '⚡' },
];

export default function WatchPartyPage(): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string }[]>([]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText('https://azeeboplus.com/watch-party?room=AZ-8492');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'You',
      avatar: '🌟',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const triggerReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    setFloatingReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  return (
    <PageShell maxWidth="full" activeNav="Live">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Watch Party Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 rounded-az-card border border-az-glass-border bg-az-surface-root p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-az-error-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-az-error-500" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="az-title text-az-ink font-bold">
                  The Nollywood Heist • Synced Watch Room
                </h1>
                <span className="rounded bg-az-flame/20 px-2 py-0.5 text-[10px] font-black text-az-flame uppercase">
                  Party Live
                </span>
              </div>
              <p className="az-caption text-az-ink-muted">
                Host: Tolu_Lagos • Synchronized Playback (Watches together in real-time)
              </p>
            </div>
          </div>

          {/* Room Code & Member Avatars */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center -space-x-2">
              {PARTICIPANTS.map((p, i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-az-surface-panel border-2 border-az-surface-root text-sm"
                  title={p.name}
                >
                  {p.avatar}
                </div>
              ))}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-az-surface-edge text-[10px] font-bold text-az-ink border-2 border-az-surface-root">
                +12
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="rounded-az-pill border border-az-glass-border bg-az-surface-root px-3.5 py-1.5 text-xs font-bold text-az-ink hover:bg-az-surface-panel transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-az-success-400" /> Copied Room Link!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-az-flame" /> Room: AZ-8492
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Screening & Chat Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Synchronized Screen (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video w-full rounded-az-card bg-az-surface-panel overflow-hidden border border-az-glass-border flex items-center justify-center group shadow-2xl">
              {/* Floating Reaction Animations */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
                <AnimatePresence>
                  {floatingReactions.map((r) => (
                    <motion.span
                      key={r.id}
                      initial={{ opacity: 1, y: 150, scale: 0.5 }}
                      animate={{ opacity: 0, y: -100, scale: 1.8 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.8, ease: 'easeOut' }}
                      className="absolute right-12 bottom-12 text-3xl"
                    >
                      {r.emoji}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>

              {/* Main Screen Poster Placeholder */}
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-az-flame text-az-surface-root shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="h-8 w-8 fill-current ml-1" />
                </div>
                <p className="az-caption text-az-ink-dim font-bold">
                  Synced Playback • 1080p 60fps
                </p>
                <span className="text-[10px] text-az-ink-muted">
                  Room Host Controls Pause & Scrubbing
                </span>
              </div>

              {/* Player Bottom Control Strip */}
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
                  <span className="text-[10px] text-white/70 font-semibold mr-1">React:</span>
                  {['🔥', '😂', '🍿', '😱', '👏'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => triggerReaction(emoji)}
                      className="rounded-full bg-white/10 hover:bg-white/25 px-2.5 py-1 text-sm transition-transform active:scale-90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Room Info */}
            <div className="flex items-center justify-between text-xs text-az-ink-muted px-2">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-az-flame" /> 16 Friends Watching Synchronized
              </span>
              <span className="flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5 text-az-flame" /> Powered by WebRTC Room Engine
              </span>
            </div>
          </div>

          {/* Side Room Live Chat */}
          <div className="rounded-az-card border border-az-glass-border bg-az-surface-root flex flex-col h-[520px] shadow-xl overflow-hidden">
            {/* Chat Title */}
            <div className="px-4 py-3 border-b border-az-glass-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-az-ink">
                  Party Live Chat
                </h3>
                <span className="rounded-full bg-az-flame/20 px-2 py-0.2 text-[9px] font-bold text-az-flame">
                  LIVE
                </span>
              </div>
              <span className="text-[10px] text-az-ink-muted">{chatMessages.length} Messages</span>
            </div>

            {/* Chat Messages Scroll */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{msg.avatar}</span>
                    <span className="text-xs font-bold text-az-ink">{msg.sender}</span>
                    {msg.isHost && (
                      <span className="rounded bg-az-flame/20 px-1 py-0.2 text-[8px] font-black text-az-flame uppercase">
                        HOST
                      </span>
                    )}
                    <span className="text-[10px] text-az-ink-muted ml-auto">{msg.time}</span>
                  </div>
                  <p className="text-xs text-az-ink-dim pl-6">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-az-glass-border flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => triggerReaction('🍿')}
                className="rounded p-1.5 text-az-ink-muted hover:text-az-ink"
              >
                <Smile className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Send a comment to the room..."
                className="flex-1 rounded-az-pill border border-az-glass-border bg-az-surface-panel px-3.5 py-1.5 text-xs text-az-ink focus:border-az-flame focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-az-flame p-2 text-az-surface-root hover:scale-105 transition-transform"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
