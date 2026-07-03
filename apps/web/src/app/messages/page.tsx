'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import { Skeleton } from '@/components/Skeleton';

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
}

interface Conversation {
  id: string;
  user: User;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
}

export default function MessagesPage(): React.JSX.Element {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const conversationsListRef = useRef<HTMLDivElement>(null);
  const _typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchConversations = async (): Promise<void> => {
      if (authLoading) return;
      if (!isAuthenticated) return;
      try {
        setIsLoadingConversations(true);
        setError(null);
        const response = await apiFetch<any>('/messages/conversations');
        if (response.success && response.data) {
          const data = Array.isArray(response.data) ? response.data : [];
          setConversations(
            data.map((conv: Record<string, unknown>) => ({
              id: conv.id as string,
              user: conv.user as User,
              lastMessage: conv.lastMessage as string,
              timestamp: new Date(conv.timestamp as string),
              unreadCount: conv.unreadCount as number,
            }))
          );
          setUnreadCount(
            data.reduce(
              (sum: number, conv: Record<string, unknown>) => sum + (conv.unreadCount as number),
              0
            )
          );
        }
      } catch (err) {
        setError('Failed to load conversations');
      } finally {
        setIsLoadingConversations(false);
      }
    };
    fetchConversations();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedConversation) return;

    const controller = new AbortController();

    const fetchMessages = async (): Promise<void> => {
      try {
        setIsLoadingMessages(true);
        const response = await apiFetch<any>(
          `/messages/conversations/${selectedConversation.id}/messages`,
          { signal: controller.signal }
        );
        if (response.success && response.data) {
          const data = Array.isArray(response.data) ? response.data : [];
          setMessages(
            data.map((msg: any) => ({
              id: String(msg.id),
              senderId: String(msg.senderId),
              receiverId: String(msg.receiverId),
              content: String(msg.content),
              timestamp: new Date(msg.timestamp || msg.createdAt),
              read: Boolean(msg.read),
            }))
          );
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        /* intentionally minimal */
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingMessages(false);
        }
      }
    };
    fetchMessages();

    return () => {
      controller.abort();
    };
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    messageInputRef.current?.focus();
  }, [selectedConversation]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    try {
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: user.id,
        receiverId: selectedConversation.user.id,
        content: newMessage,
        timestamp: new Date(),
        read: false,
      };
      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage('');
      const response = await apiFetch<any>(
        `/messages/conversations/${selectedConversation.id}/messages`,
        { method: 'POST', body: JSON.stringify({ content: newMessage }) }
      );
      if (response.success && response.data) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id
              ? { ...response.data, timestamp: new Date(response.data.timestamp) }
              : msg
          )
        );
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversation.id
              ? {
                  ...conv,
                  lastMessage: response.data.content,
                  timestamp: new Date(response.data.timestamp),
                }
              : conv
          )
        );
      } else {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      }
    } catch (err) {
      /* intentionally minimal */
    }
  }, [newMessage, selectedConversation, user]);

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

  const handleConversationSelect = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    setUnreadCount((prev) => Math.max(0, prev - conversation.unreadCount));
    setConversations((prev) =>
      prev.map((conv) => (conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv))
    );
  }, []);

  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
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
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
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
                      style={{ background: '#E8420A', color: '#fff' }}
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
                            <img
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
                            style={{ background: '#E8420A', color: '#fff' }}
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
                    <div>
                      <h2 className="font-bold text-white text-sm">
                        {selectedConversation.user.name}
                      </h2>
                      <p className="text-xs text-white/50">
                        {selectedConversation.user.role || 'User'}
                      </p>
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
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${message.senderId === user?.id ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                            style={
                              message.senderId === user?.id
                                ? { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }
                                : { background: 'rgba(255,255,255,0.08)' }
                            }
                          >
                            <p className="text-sm text-white">{message.content}</p>
                            <p className="text-[10px] text-white/50 mt-1">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
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
