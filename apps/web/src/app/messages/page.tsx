'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export default function MessagesPage(): JSX.Element {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async (): Promise<void> => {
    try {
      const result = await apiFetch<Conversation[]>('/v1/messaging/conversations');

      if (result.success && result.data) {
        setConversations(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openConversation = async (conversation: Conversation): Promise<void> => {
    setSelectedConversation(conversation);
    try {
      const result = await apiFetch<Message[]>(`/v1/messaging/conversations/${conversation.id}/messages`);

      if (result.success && result.data) {
        setMessages(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async (): Promise<void> => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      const result = await apiFetch(`/v1/messaging/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (result.success) {
        setNewMessage('');
        const messagesResult = await apiFetch<Message[]>(
          `/v1/messaging/conversations/${selectedConversation.id}/messages`
        );

        if (messagesResult.success && messagesResult.data) {
          setMessages(messagesResult.data);
        }
      }
    } catch (error) {
      webLogger.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <div className={`w-full md:w-96 border-r border-border bg-card ${selectedConversation ? 'hidden md:block' : ''}`}>
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          </div>
          <div className="overflow-y-auto h-[calc(100vh-80px)]">
            {conversations.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl font-bold text-foreground mb-2">No messages yet</h2>
                <p className="text-muted-foreground">Start a conversation with other users</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center gap-4 p-4 border-b border-border cursor-pointer hover:bg-accent/50 ${
                    selectedConversation?.id === conversation.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => openConversation(conversation)}
                >
                  <div className="relative">
                    <img
                      src={conversation.participantAvatar}
                      alt={conversation.participantName}
                      className="w-12 h-12 rounded-full"
                    />
                    {conversation.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground truncate">{conversation.participantName}</h3>
                      <span className="text-xs text-muted-foreground">{formatTime(conversation.lastMessageTime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full ml-2">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {selectedConversation ? (
          <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
            <div className="p-4 border-b border-border bg-card flex items-center gap-4">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden text-muted-foreground hover:text-foreground"
              >
                ←
              </button>
              <div className="relative">
                <img
                  src={selectedConversation.participantAvatar}
                  alt={selectedConversation.participantName}
                  className="w-10 h-10 rounded-full"
                />
                {selectedConversation.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card"></span>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{selectedConversation.participantName}</h2>
                <p className="text-xs text-green-500">{selectedConversation.isOnline ? 'Online' : 'Offline'}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.senderId === 'me'
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.senderId === 'me' ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className={`px-6 py-3 bg-primary text-white rounded-lg font-semibold ${
                    !newMessage.trim() || isSending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'
                  }`}
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-background">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Select a conversation</h2>
              <p className="text-muted-foreground">Choose a conversation from the sidebar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
