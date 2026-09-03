'use client';

import { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { Send, Trash2 } from 'lucide-react';
import { webLogger } from '@/lib/logger';

interface CommentsProps {
  contentId: string;
}

export function Comments({ contentId }: CommentsProps) {
  const {
    comments,
    isLoading,
    isConnected,
    addComment,
    addReaction,
    deleteComment,
    reactionEmojis,
  } = useComments(contentId);

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(newComment.trim());
      setNewComment('');
    } catch (err) {
      webLogger.error('Failed to add comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading comments...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 18, fontWeight: 600 }}>Comments ({comments.length})</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: isConnected ? 'var(--brand-emerald)' : 'var(--brand-red)',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isConnected ? 'var(--brand-emerald)' : 'var(--brand-red)',
            }}
          />
          {isConnected ? 'Live' : 'Offline'}
        </div>
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid var(--glass-border)',
            backgroundColor: 'var(--glass-bg)',
            color: 'var(--text-primary)',
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            border: 'none',
            backgroundColor: newComment.trim() ? 'var(--brand-orange)' : 'var(--border-default)',
            color: newComment.trim() ? 'white' : 'var(--text-muted)',
            cursor: newComment.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Send size={18} />
        </button>
      </form>

      {/* Comments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {comments.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: 16,
                borderRadius: 12,
                border: '1px solid var(--glass-border)',
                backgroundColor: 'var(--glass-bg)',
              }}
            >
              {/* Comment Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'var(--brand-orange)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'white',
                    }}
                  >
                    {comment.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{comment.userName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(comment.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {comment.userId === 'current_user' && (
                  <button
                    onClick={() => deleteComment(comment.id)}
                    style={{
                      padding: 4,
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Comment Text */}
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{comment.text}</p>

              {/* Reactions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(reactionEmojis).map(([key, emoji]) => {
                  const count = comment.reactions[key] || 0;
                  const isActive = comment.userReactions.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => addReaction(comment.id, key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        borderRadius: 8,
                        border: `1px solid ${isActive ? 'var(--brand-orange)' : 'var(--glass-border)'}`,
                        backgroundColor: isActive ? 'rgba(232, 66, 10, 0.1)' : 'transparent',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      <span>{emoji}</span>
                      {count > 0 && <span>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
