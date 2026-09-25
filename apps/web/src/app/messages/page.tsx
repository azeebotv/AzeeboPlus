'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';

interface User {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  isEdited?: boolean;
  isPinned?: boolean;
  isDeleted?: boolean;
  replyToId?: string;
  reactions?: { emoji: string; count: number }[];
}

interface Conversation {
  id: string;
  user: User;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isMuted?: boolean;
  isArchived?: boolean;
  name?: string;
}

interface RawConversation {
  id: string;
  /** The messaging API actually returns { name, avatar, participants[] }
   *  without a nested `user` object; normalize to a synthetic user below. */
  user?: Partial<User>;
  name?: string | null;
  avatar?: string | null;
  participants?: { id: string; displayName?: string | null; avatar?: string | null }[];
  lastMessage?: string;
  lastMessageAt?: string;
  timestamp?: string;
  unreadCount?: number;
  isMuted?: boolean;
  isArchived?: boolean;
}

interface RawMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp?: string;
  createdAt?: string;
  read: boolean;
  isEdited?: boolean;
  isPinned?: boolean;
  isDeleted?: boolean;
  replyToId?: string;
}

export default function MessagesPage(): React.JSX.Element {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const conversationsListRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: async () => {
      const response = await apiFetch<RawConversation[]>('/messaging/conversations');
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [];
        return data.map((conv: RawConversation) => {
          const other = conv.participants?.find(Boolean);
          const displayName = conv.name || other?.displayName || 'Conversation';
          return {
            id: conv.id,
            user: {
              id: other?.id ?? conv.id,
              name: displayName,
              avatar: conv.avatar ?? other?.avatar ?? undefined,
            } as User,
            lastMessage: conv.lastMessage ?? '',
            timestamp: new Date(conv.lastMessageAt ?? conv.timestamp ?? Date.now()),
            unreadCount: conv.unreadCount ?? 0,
          };
        });
      }
      return [];
    },
    enabled: isAuthenticated && !authLoading,
    staleTime: 10000,
  });

  const messagesQuery = useQuery({
    queryKey: ['messages', 'conversation', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await apiFetch<RawMessage[]>(
        `/messaging/conversations/${selectedConversation.id}/messages`
      );
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [];
        return data.map((msg: RawMessage) => ({
          id: String(msg.id),
          senderId: String(msg.senderId),
          receiverId: String(msg.receiverId),
          content: String(msg.content),
          timestamp: new Date(msg.timestamp || msg.createdAt || ''),
          read: Boolean(msg.read),
          isEdited: Boolean(msg.isEdited),
          isPinned: Boolean(msg.isPinned),
          replyToId: msg.replyToId ? String(msg.replyToId) : undefined,
        }));
      }
      return [];
    },
    enabled: !!selectedConversation,
    staleTime: 5000,
  });

  const conversations = conversationsQuery.data ?? [];
  const messages = messagesQuery.data ?? [];
  const unreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  const isLoadingConversations = conversationsQuery.isLoading;
  const isLoadingMessages = messagesQuery.isLoading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    messageInputRef.current?.focus();
  }, [selectedConversation]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      senderId: user.id,
      receiverId: selectedConversation.user.id,
      content: newMessage,
      timestamp: new Date(),
      read: false,
    };

    queryClient.setQueryData<Message[]>(
      ['messages', 'conversation', selectedConversation.id],
      (old) => [...(old ?? []), tempMessage]
    );
    setNewMessage('');

    try {
      const response = await apiFetch<RawMessage>(
        `/messaging/conversations/${selectedConversation.id}/messages`,
        { method: 'POST', body: JSON.stringify({ content: newMessage }) }
      );
      if (response.success && response.data) {
        const msgData = response.data;
        queryClient.setQueryData<Message[]>(
          ['messages', 'conversation', selectedConversation.id],
          (old) =>
            (old ?? []).map((msg) =>
              msg.id === tempId
                ? ({
                    ...msgData,
                    timestamp: new Date(msgData.timestamp || msgData.createdAt || ''),
                  } as Message)
                : msg
            )
        );
        queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      } else {
        queryClient.setQueryData<Message[]>(
          ['messages', 'conversation', selectedConversation.id],
          (old) => (old ?? []).filter((msg) => msg.id !== tempId)
        );
      }
    } catch {
      queryClient.setQueryData<Message[]>(
        ['messages', 'conversation', selectedConversation.id],
        (old) => (old ?? []).filter((msg) => msg.id !== tempId)
      );
    }
  }, [newMessage, selectedConversation, user, queryClient]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const handleConversationKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const items = conversationsListRef.current?.querySelectorAll('[role="option"]');
    if (!items) return;
    let nextIndex = index;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % items.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + items.length) % items.length;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      (items[index] as HTMLElement).click();
      return;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = items.length - 1;
    }
    (items[nextIndex] as HTMLElement).focus();
  }, []);

  const handleConversationSelect = useCallback(
    (conversation: Conversation) => {
      setSelectedConversation(conversation);
      queryClient.setQueryData<Conversation[]>(['messages', 'conversations'], (old) =>
        (old ?? []).map((conv) =>
          conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
        )
      );
    },
    [queryClient]
  );

  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Mutations for new features ---

  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      return apiFetch(`/messaging/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      setEditingMessageId(null);
      setEditContent('');
      queryClient.invalidateQueries({
        queryKey: ['messages', 'conversation', selectedConversation?.id],
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return apiFetch(`/messaging/messages/${messageId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['messages', 'conversation', selectedConversation?.id],
      });
    },
  });

  const reactMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const convId = selectedConversation?.id;
      if (!convId) return;
      return apiFetch(`/messaging/conversations/${convId}/messages/${messageId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['messages', 'conversation', selectedConversation?.id],
      });
    },
  });

  const pinMutation = useMutation({
    mutationFn: async ({ messageId, pinned }: { messageId: string; pinned: boolean }) => {
      return apiFetch(`/messaging/messages/${messageId}/pin`, {
        method: 'PUT',
        body: JSON.stringify({ pinned }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['messages', 'conversation', selectedConversation?.id],
      });
    },
  });

  const muteMutation = useMutation({
    mutationFn: async ({ conversationId, muted }: { conversationId: string; muted: boolean }) => {
      return apiFetch(`/messaging/conversations/${conversationId}/mute`, {
        method: 'PUT',
        body: JSON.stringify({ muted }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({
      conversationId,
      archived,
    }: {
      conversationId: string;
      archived: boolean;
    }) => {
      return apiFetch(`/messaging/conversations/${conversationId}/archive`, {
        method: 'PUT',
        body: JSON.stringify({ archived }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      if (selectedConversation) setSelectedConversation(null);
    },
  });

  if (authLoading) return <></>;
  if (!isAuthenticated) {
    return (
      <PageShell glowColor="rgba(232,66,10,0.15)">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="az-glass p-10 text-center rounded-3xl border border-white/10 max-w-md mx-auto shadow-2xl">
            <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight">
              Sign in to access messages
            </h2>
            <p className="text-white/50 text-sm">
              Connect with African creators and community members
            </p>
          </div>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell glowColor="rgba(232,66,10,0.12)">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div
          className="az-glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
          style={{ height: 'calc(100vh - 180px)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Conversations Sidebar */}
            <div
              className="border-r flex flex-col h-full"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-bold text-white">Messages</h1>
                  {unreadCount > 0 && (
                    <span
                      className="px-2 py-1 text-[10px] font-bold rounded-full"
                      style={{
                        background: 'var(--brand-orange, #E8420A)',
                        color: 'var(--brand-white)',
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>
                <input
                  type="search"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="az-input w-full text-sm"
                  aria-label="Search conversations"
                />
              </div>
              <div
                ref={conversationsListRef}
                role="listbox"
                aria-label="Conversations"
                className="flex-1 overflow-y-auto"
                tabIndex={0}
              >
                {isLoadingConversations ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton width="48px" height="48px" borderRadius="50%" />
                        <div className="flex-1 space-y-2">
                          <Skeleton width="70%" height="14px" />
                          <Skeleton width="50%" height="12px" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <EmptyState
                    icon="MessageCircle"
                    title="No conversations found"
                    description="Start a conversation with a creator or friend"
                    dark
                  />
                ) : (
                  filteredConversations.map((conversation, index) => (
                    <div
                      key={conversation.id}
                      role="option"
                      aria-selected={selectedConversation?.id === conversation.id}
                      tabIndex={-1}
                      onClick={() => handleConversationSelect(conversation)}
                      onKeyDown={(e) => handleConversationKeyDown(e, index)}
                      className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b ${
                        selectedConversation?.id === conversation.id
                          ? 'text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                      style={
                        selectedConversation?.id === conversation.id
                          ? { background: 'rgba(232,66,10,0.15)' }
                          : { borderColor: 'rgba(255,255,255,0.05)' }
                      }
                    >
                      <div className="relative">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                        >
                          {conversation.user.avatar ? (
                            <OptimizedImage
                              src={conversation.user.avatar}
                              alt={conversation.user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            conversation.user.name.charAt(0)
                          )}
                        </div>
                        {conversation.unreadCount > 0 && (
                          <div
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{
                              background: 'var(--brand-orange, #E8420A)',
                              color: 'var(--brand-white)',
                            }}
                          >
                            {conversation.unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3
                            className={`font-medium text-sm truncate ${conversation.unreadCount > 0 ? 'text-white' : 'text-white/70'}`}
                          >
                            {conversation.user.name}
                          </h3>
                          <span className="text-xs text-white/40 flex-shrink-0">
                            {conversation.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p
                          className={`text-xs truncate mt-0.5 ${conversation.unreadCount > 0 ? 'text-white/70' : 'text-white/40'}`}
                        >
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-2 flex flex-col h-full">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div
                    className="p-4 border-b flex items-center gap-3"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                    >
                      {selectedConversation.user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-white text-sm">
                        {selectedConversation.name || selectedConversation.user.name}
                      </h2>
                      <p className="text-xs text-white/50">
                        {selectedConversation.user.role || 'User'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        aria-label={
                          selectedConversation.isMuted ? 'Unmute conversation' : 'Mute conversation'
                        }
                        onClick={() =>
                          muteMutation.mutate({
                            conversationId: selectedConversation.id,
                            muted: !selectedConversation.isMuted,
                          })
                        }
                        className="text-xs px-2 py-1 rounded border"
                        style={{
                          borderColor: 'rgba(255,255,255,0.2)',
                          color: selectedConversation.isMuted
                            ? 'var(--color-warning-500)'
                            : 'var(--text-muted, #9A8A7A)',
                        }}
                      >
                        {selectedConversation.isMuted ? 'Unmute' : 'Mute'}
                      </button>
                      <button
                        aria-label="Archive conversation"
                        onClick={() => {
                          archiveMutation.mutate({
                            conversationId: selectedConversation.id,
                            archived: true,
                          });
                        }}
                        className="text-xs px-2 py-1 rounded border"
                        style={{
                          borderColor: 'rgba(255,255,255,0.2)',
                          color: 'var(--text-muted, #9A8A7A)',
                        }}
                      >
                        Archive
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                    role="log"
                    aria-label="Message history"
                    aria-live="polite"
                  >
                    {isLoadingMessages ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
                          >
                            <Skeleton
                              width={`${40 + (i % 5) * 6}%`}
                              height="40px"
                              borderRadius="12px"
                            />
                          </div>
                        ))}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                          <svg
                            className="w-7 h-7"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.865 5.247 5.247 0 00.998-2.604A8.204 8.204 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Start a conversation</h3>
                        <p className="text-white/50 text-sm">
                          Send a message to {selectedConversation.user.name}
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${message.senderId === user?.id ? 'rounded-br-sm' : 'rounded-bl-sm'} ${message.isPinned ? 'ring-2 ring-yellow-400/50' : ''}`}
                            style={
                              message.senderId === user?.id
                                ? { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }
                                : { background: 'rgba(255,255,255,0.08)' }
                            }
                          >
                            {message.replyToId && (
                              <p className="text-[10px] text-white/40 mb-1 italic">
                                Replying to a message
                              </p>
                            )}
                            {editingMessageId === message.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="flex-1 bg-white/10 text-white rounded px-2 py-1 text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter')
                                      editMessageMutation.mutate({
                                        messageId: message.id,
                                        content: editContent,
                                      });
                                    if (e.key === 'Escape') setEditingMessageId(null);
                                  }}
                                  autoFocus
                                />
                                <button
                                  aria-label="Save edited message"
                                  onClick={() =>
                                    editMessageMutation.mutate({
                                      messageId: message.id,
                                      content: editContent,
                                    })
                                  }
                                  className="text-xs text-green-400"
                                >
                                  Save
                                </button>
                                <button
                                  aria-label="Cancel editing"
                                  onClick={() => setEditingMessageId(null)}
                                  className="text-xs text-red-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm text-white">{message.content}</p>
                            )}
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[10px] text-white/50">
                                {new Date(message.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {message.isEdited && <span className="ml-1">(edited)</span>}
                                {message.isPinned && (
                                  <svg
                                    className="w-3 h-3 ml-1 inline text-amber-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.828.722a.5.5 0 01.354 0l4.5 1.5a.5.5 0 01.332.474v4.304l2.128 3.548A.5.5 0 0116.71 11.25H10.5v7.25a.5.5 0 01-1 0V11.25H3.29a.5.5 0 01-.432-.702l2.128-3.548V2.696a.5.5 0 01.332-.474l4.5-1.5z" />
                                  </svg>
                                )}
                              </p>
                              <div className="flex gap-1 ml-2">
                                <button
                                  aria-label={message.isPinned ? 'Unpin message' : 'Pin message'}
                                  onClick={() =>
                                    pinMutation.mutate({
                                      messageId: message.id,
                                      pinned: !message.isPinned,
                                    })
                                  }
                                  className="text-[10px] text-white/40 hover:text-yellow-400"
                                >
                                  {message.isPinned ? 'Unpin' : 'Pin'}
                                </button>
                                {message.senderId === user?.id &&
                                  editingMessageId !== message.id && (
                                    <>
                                      <button
                                        aria-label="Edit message"
                                        onClick={() => {
                                          setEditingMessageId(message.id);
                                          setEditContent(message.content);
                                        }}
                                        className="text-[10px] text-white/40 hover:text-white"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        aria-label="Delete message"
                                        onClick={() => deleteMessageMutation.mutate(message.id)}
                                        className="text-[10px] text-white/40 hover:text-red-400"
                                      >
                                        Del
                                      </button>
                                    </>
                                  )}
                              </div>
                            </div>
                            <div className="flex gap-1 mt-1">
                              {[
                                { emoji: 'ThumbsUp', label: 'Thumbs up' },
                                { emoji: 'Heart', label: 'Heart' },
                                { emoji: 'Laugh', label: 'Laughing face' },
                              ].map((reaction) => (
                                <button
                                  key={reaction.emoji}
                                  aria-label={`React with ${reaction.label}`}
                                  onClick={() =>
                                    reactMutation.mutate({
                                      messageId: message.id,
                                      emoji: reaction.emoji,
                                    })
                                  }
                                  className="text-xs hover:scale-125 transition-transform"
                                >
                                  {reaction.emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="flex items-end gap-2">
                      <textarea
                        ref={messageInputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 bg-white/5 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm resize-none border outline-none focus:border-[var(--brand-orange)]"
                        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                        rows={1}
                        aria-label="Type a message"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="az-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          width: 'auto',
                          paddingInline: '1.25rem',
                          padding: '0.75rem 1.25rem',
                          borderRadius: '12px',
                        }}
                        aria-label="Send message"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Select a conversation</h3>
                    <p className="text-white/50 text-sm">
                      Choose a conversation from the left to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
