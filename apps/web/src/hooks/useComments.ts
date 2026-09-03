'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface Comment {
  id: string;
  contentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
  reactions: Record<string, number>;
  userReactions: string[];
}

interface CommentPayload {
  event: 'new_comment' | 'delete_comment' | 'reaction_update';
  data: Comment | { commentId: string; reaction: string; count: number };
}

const REACTION_EMOJIS: Record<string, string> = {
  like: '👍',
  love: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
};

export function useComments(contentId: string) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [optimisticComments, setOptimisticComments] = useState<Comment[]>([]);

  // Fetch existing comments
  const commentsQuery = useQuery({
    queryKey: ['comments', contentId],
    queryFn: async () => {
      const res = await apiFetch<Comment[]>(`/content/${contentId}/comments`);
      return res.success ? res.data || [] : [];
    },
    staleTime: 30000,
  });

  const comments = [...(commentsQuery.data || []), ...optimisticComments];

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!contentId) return;

    const wsUrl = `ws://localhost:3006/comments?contentId=${contentId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // WebSocket connected
    };

    ws.onmessage = (event) => {
      try {
        const payload: CommentPayload = JSON.parse(event.data);

        switch (payload.event) {
          case 'new_comment':
            queryClient.setQueryData<Comment[]>(['comments', contentId], (old) => {
              const exists = old?.some((c) => c.id === (payload.data as Comment).id);
              if (exists) return old;
              return [payload.data as Comment, ...(old || [])];
            });
            break;
          case 'delete_comment':
            queryClient.setQueryData<Comment[]>(
              ['comments', contentId],
              (old) =>
                old?.filter((c) => c.id !== (payload.data as { commentId: string }).commentId) || []
            );
            break;
          case 'reaction_update':
            queryClient.setQueryData<Comment[]>(
              ['comments', contentId],
              (old) =>
                old?.map((c) => {
                  if (c.id === (payload.data as { commentId: string }).commentId) {
                    return {
                      ...c,
                      reactions: {
                        ...c.reactions,
                        [(payload.data as { reaction: string }).reaction]: (
                          payload.data as { count: number }
                        ).count,
                      },
                    };
                  }
                  return c;
                }) || []
            );
            break;
        }
      } catch (err) {
        webLogger.error('[Comments] Failed to parse message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // WebSocket disconnected
    };

    ws.onerror = (error) => {
      webLogger.error('[Comments] WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [contentId, queryClient]);

  // Add comment with optimistic update
  const addComment = useCallback(
    async (text: string) => {
      const optimisticComment: Comment = {
        id: `temp_${Date.now()}`,
        contentId,
        userId: 'current_user',
        userName: 'You',
        text,
        timestamp: new Date().toISOString(),
        reactions: {},
        userReactions: [],
      };

      setOptimisticComments((prev) => [optimisticComment, ...prev]);

      try {
        const res = await apiFetch<Comment>(`/content/${contentId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ text }),
        });

        if (res.success && res.data) {
          // Replace optimistic comment with real one
          setOptimisticComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
          queryClient.setQueryData<Comment[]>(['comments', contentId], (old) => [
            res.data!,
            ...(old || []),
          ]);
        }
      } catch (err) {
        // Remove optimistic comment on error
        setOptimisticComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
        throw err;
      }
    },
    [contentId, queryClient]
  );

  // Add reaction
  const addReaction = useCallback(
    async (commentId: string, reaction: string) => {
      try {
        await apiFetch(`/content/${contentId}/comments/${commentId}/reactions`, {
          method: 'POST',
          body: JSON.stringify({ reaction }),
        });
      } catch (err) {
        webLogger.error('[Comments] Failed to add reaction:', err);
      }
    },
    [contentId]
  );

  // Delete comment
  const deleteComment = useCallback(
    async (commentId: string) => {
      try {
        await apiFetch(`/content/${contentId}/comments/${commentId}`, {
          method: 'DELETE',
        });
        queryClient.setQueryData<Comment[]>(
          ['comments', contentId],
          (old) => old?.filter((c) => c.id !== commentId) || []
        );
      } catch (err) {
        webLogger.error('[Comments] Failed to delete comment:', err);
      }
    },
    [contentId, queryClient]
  );

  return {
    comments,
    isLoading: commentsQuery.isLoading,
    error: commentsQuery.error,
    isConnected,
    addComment,
    addReaction,
    deleteComment,
    reactionEmojis: REACTION_EMOJIS,
  };
}
