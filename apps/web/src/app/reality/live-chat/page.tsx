'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';
import { pollingIntervals } from '@azeebo/design-tokens';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  timestamp: string;
  type: 'message' | 'system' | 'vote';
}

interface Participant {
  id: string;
  username: string;
  avatar: string;
  isOnline: boolean;
}

function LiveChatPageContent(): React.JSX.Element {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    analytics.pageView('reality-live-chat');
  }, []);

  const chatQuery = useQuery({
    queryKey: ['live-chat-messages'],
    queryFn: async () => {
      const res = await api.request<ChatMessage[]>('/api/v1/reality/live-chat/messages');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load messages');
    },
    refetchInterval: pollingIntervals.chat,
    staleTime: 1000,
  });

  const participantsQuery = useQuery({
    queryKey: ['live-chat-participants'],
    queryFn: async () => {
      const res = await api.request<Participant[]>('/api/v1/reality/live-chat/participants');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load participants');
    },
    refetchInterval: pollingIntervals.active,
    staleTime: 5000,
  });

  useEffect(() => {
    if (chatQuery.data) {
      setMessages(chatQuery.data);
    }
  }, [chatQuery.data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) return;

    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      userId: 'current',
      username: 'You',
      avatar: '',
      content: message,
      timestamp: new Date().toISOString(),
      type: 'message',
    };

    setMessages((prev) => [...prev, tempMessage]);
    setMessage('');

    try {
      await api.request('/api/v1/reality/live-chat/send', {
        method: 'POST',
        body: JSON.stringify({ content: message }),
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    }
  }, [message]);

  const participants: Participant[] = participantsQuery.data ?? [];
  const isLoading = chatQuery.isLoading;
  const error = chatQuery.error?.message;
  const onlineCount = participants.filter((p) => p.isOnline).length;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <PageShell maxWidth="7xl" activeNav="Reality">
      <PageHero
        title="Live Chat"
        description="Join the conversation with other fans"
        actions={
          <motion.button
            type="button"
            role="switch"
            aria-checked={showParticipants}
            onClick={() => setShowParticipants(!showParticipants)}
            className="az-chip az-body-strong inline-flex items-center gap-2 px-4 py-2 text-az-ink"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="size-2 rounded-full bg-az-success-400" aria-hidden="true" />
            {onlineCount} Online
          </motion.button>
        }
      />

      <div className="flex w-full items-start gap-4">
        <div className="flex min-h-[420px] flex-1 flex-col">
          <GlowCard className="flex flex-1 flex-col overflow-hidden">
            <div
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
              className="flex-1 space-y-4 overflow-y-auto p-4 max-h-[calc(100vh-400px)]"
            >
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton width="36px" height="36px" borderRadius="50%" />
                      <div className="flex-1 space-y-2">
                        <Skeleton height="14px" width="30%" />
                        <Skeleton height="16px" width="80%" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <ErrorState
                  title="Failed to load chat"
                  description={error}
                  onButtonPress={() => chatQuery.refetch()}
                />
              ) : (
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-start gap-3"
                    >
                      <OptimizedImage
                        src={
                          msg.avatar ||
                          `https://ui-avatars.com/api/?name=${msg.username}&background=E8420A&color=fff`
                        }
                        alt={msg.username}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="az-body-strong text-az-ink">{msg.username}</span>
                          <span className="az-caption text-az-ink/30">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                        <p
                          className={`az-body inline-block rounded-az-control px-3 py-2 text-az-ink/80 ${
                            msg.type === 'vote' ? 'bg-az-scarlet/15' : 'bg-az-ink/5'
                          }`}
                        >
                          {msg.type === 'vote' ? 'Vote ' : ''}
                          {msg.content}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center gap-3 border-t border-az-glass-border p-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                aria-label="Type a message"
                className="az-input min-w-0 flex-1"
              />
              <motion.button
                type="button"
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="az-btn-primary az-btn-primary--sm az-btn-primary--inline shrink-0"
                whileHover={{ scale: message.trim() ? 1.05 : 1 }}
                whileTap={{ scale: message.trim() ? 0.95 : 1 }}
              >
                Send
              </motion.button>
            </div>
          </GlowCard>
        </div>

        <AnimatePresence>
          {showParticipants && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="ml-4 overflow-hidden"
            >
              <GlowCard className="h-full p-4">
                <h3 className="az-subtitle mb-4 text-az-ink">Participants ({onlineCount})</h3>
                <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-400px)]">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3"
                      aria-label={`${participant.username} is ${participant.isOnline ? 'online' : 'offline'}`}
                    >
                      <div className="relative">
                        <OptimizedImage
                          src={
                            participant.avatar ||
                            `https://ui-avatars.com/api/?name=${participant.username}&background=E8420A&color=fff`
                          }
                          alt={participant.username}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span
                          aria-hidden="true"
                          className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-az-surface-root ${
                            participant.isOnline ? 'bg-az-success-500' : 'bg-az-ink-muted'
                          }`}
                        />
                      </div>
                      <span className="az-body truncate text-az-ink/80">
                        {participant.username}
                      </span>
                    </div>
                  ))}
                </div>
              </GlowCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}

export default LiveChatPageContent;
