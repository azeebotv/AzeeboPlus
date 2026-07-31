'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

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
    refetchInterval: 3000,
    staleTime: 1000,
  });

  const participantsQuery = useQuery({
    queryKey: ['live-chat-participants'],
    queryFn: async () => {
      const res = await api.request<Participant[]>('/api/v1/reality/live-chat/participants');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load participants');
    },
    refetchInterval: 10000,
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
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--brand-near-black)' }}
    >
      <AppHeader active="Reality" />

      <section
        className="relative py-8 sm:py-12"
        style={{
          background: 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                className="text-3xl sm:text-4xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Live Chat
              </motion.h1>
              <motion.p
                className="text-white/80"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Join the conversation with other fans
              </motion.p>
            </div>
            <motion.button
              type="button"
              onClick={() => setShowParticipants(!showParticipants)}
              className="px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'var(--brand-white)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {onlineCount} Online
            </motion.button>
          </div>
        </div>
      </section>

      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex-1 flex flex-col">
          <GlowCard className="flex-1 flex flex-col overflow-hidden">
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ maxHeight: 'calc(100vh - 400px)' }}
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
                          <span className="text-sm font-semibold text-white">{msg.username}</span>
                          <span className="text-xs text-white/30">{formatTime(msg.timestamp)}</span>
                        </div>
                        <p
                          className="text-sm rounded-lg px-3 py-2 inline-block"
                          style={{
                            backgroundColor:
                              msg.type === 'vote'
                                ? 'rgba(232,66,10,0.15)'
                                : 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.8)',
                          }}
                        >
                          {msg.type === 'vote' ? '🗳️ ' : ''}
                          {msg.content}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div
              className="p-4 flex items-center gap-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 rounded-full text-sm text-white placeholder-white/30 focus:outline-none"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
              <motion.button
                type="button"
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
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
                <h3 className="text-lg font-bold text-white mb-4">Participants ({onlineCount})</h3>
                <div
                  className="space-y-3 overflow-y-auto"
                  style={{ maxHeight: 'calc(100vh - 400px)' }}
                >
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3">
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
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                          style={{
                            backgroundColor: participant.isOnline
                              ? 'var(--color-success-500)'
                              : '#6B7280',
                            borderColor: '#1A0A0A',
                          }}
                        />
                      </div>
                      <span className="text-sm text-white/80 truncate">{participant.username}</span>
                    </div>
                  ))}
                </div>
              </GlowCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AppFooter />
    </div>
  );
}

export default LiveChatPageContent;
