'use client';
import { useState, useEffect, useRef, useCallback } from 'react';


export const metadata = {
  title: 'Messages | Azeebo',
  description: 'Connect with creators and other users through direct messages on Azeebo.',
  openGraph: {
    title: 'Messages | Azeebo',
    description: 'Connect with creators and other users through direct messages on Azeebo.',
  },
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
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
  user: User;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isMuted?: boolean;
  isArchived?: boolean;
  name?: string;
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
      const response = await apiFetch<RawConversation[]>('/messages/conversations');
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [];
        return data.map((conv: RawConversation) => ({
          id: conv.id,
          user: conv.user,
          lastMessage: conv.lastMessage,
          timestamp: new Date(conv.timestamp),
          unreadCount: conv.unreadCount,
        }));
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
        `/messages/conversations/${selectedConversation.id}/messages`
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
        `/messages/conversations/${selectedConversation.id}/messages`,
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
      return apiFetch(`/messages/messages/${messageId}`, {
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
      return apiFetch(`/messages/messages/${messageId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['messages', 'conversation', selectedConversation?.id],
      });
    },
  });

  const reactMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      return apiFetch(`/messages/messages/${messageId}/react`, {
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
      return apiFetch(`/messages/messages/${messageId}/pin`, {
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
      return apiFetch(`/messages/conversations/${conversationId}/mute`, {
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
      return apiFetch(`/messages/conversations/${conversationId}/archive`, {
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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary, #1A0A0A)' }}>
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="az-glass p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Sign in to access messages</h2>
            <p className="text-white/50">Connect with creators and other users</p>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary, #1A0A0A)' }}>
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="az-glass overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
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
                      style={{ background: 'var(--brand-orange, #E8420A)', color: 'var(--brand-white)' }}
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
                  <div className="p-6 text-center">
                    <p className="text-white/50 text-sm">No conversations found</p>
                  </div>
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
                            style={{ background: 'var(--brand-orange, #E8420A)', color: 'var(--brand-white)' }}
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
                        aria-label={selectedConversation.isMuted ? 'Unmute conversation' : 'Mute conversation'}
                        onClick={() =>
                          muteMutation.mutate({
                            conversationId: selectedConversation.id,
                            muted: !selectedConversation.isMuted,
                          })
                        }
                        className="text-xs px-2 py-1 rounded border"
                        style={{
                          borderColor: 'rgba(255,255,255,0.2)',
                          color: selectedConversation.isMuted ? 'var(--color-warning-500)' : 'var(--text-muted, #9A8A7A)',
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
                        style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'var(--text-muted, #9A8A7A)' }}
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
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <span className="text-4xl mb-4 block">&#x1F4AC;</span>
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
                                {message.isPinned && <span className="ml-1">&#x1F4CC;</span>}
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
                                { emoji: '👍', label: 'Thumbs up' },
                                { emoji: '❤️', label: 'Heart' },
                                { emoji: '😂', label: 'Laughing face' },
                              ].map((reaction) => (
                                <button
                                  key={reaction.emoji}
                                  aria-label={`React with ${reaction.label}`}
                                  onClick={() =>
                                    reactMutation.mutate({ messageId: message.id, emoji: reaction.emoji })
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
                        className="flex-1 bg-white/5 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm resize-none border outline-none focus:border-[#E8420A]"
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
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-5xl mb-4 block">&#x1F4AC;</span>
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
      <AppFooter />
    </div>
  );
}
