import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import type { Challenge, UploadProgress } from '@/lib/creator-types';
import { formatNgn, errorTextStyle } from '@/lib/ui';

/**
 * Submit-entry dialog for a challenge: optional stored-upload attachment
 * picker + entry title. Shared by the challenges grid and the challenge
 * detail page so both entry points behave identically.
 *
 * Closing after success is intentional — the invalidated submissions and
 * challenges queries surface the new entry on the page underneath.
 */
export default function ChallengeSubmitDialog({
  challenge,
  onClose,
}: {
  challenge: Challenge;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitContentId, setSubmitContentId] = useState<string | null>(null);

  // Uploads whose bytes are actually in blob storage — the only ones that can
  // be attached to a challenge entry (title-only entries stay allowed).
  const { data: uploads, isLoading: uploadsLoading } = useQuery({
    queryKey: ['creator', 'uploads'],
    queryFn: async () => {
      const res = await creatorApi.getUploads();
      return res.success ? (res.data as UploadProgress[]) : [];
    },
  });
  const storedContent = (uploads ?? []).filter((u) => u.storage === 'stored');

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await creatorApi.submitChallenge(challenge.id, submitTitle, submitContentId ?? undefined);
      return creatorApi.assertSuccess<{ success: boolean; submissionId?: string }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'challenge-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'challenges'] });
      onClose();
    },
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 480,
          maxWidth: '90%',
          backgroundColor: 'var(--creator-bg)',
          border: '1px solid var(--creator-border)',
          borderRadius: 16,
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
          Submit to: {challenge.title}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 16 }}>
          Prize: {formatNgn(challenge.prize)}
        </p>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 6 }}>
            Attach an upload <span style={{ opacity: 0.7 }}>(optional — stored content only)</span>
          </label>
          {uploadsLoading ? (
            <div style={{ fontSize: 13, color: 'var(--creator-text-muted)', padding: '10px 14px', border: '1px dashed var(--creator-border)', borderRadius: 8 }}>
              Loading your uploads…
            </div>
          ) : storedContent.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--creator-text-muted)', padding: '10px 14px', border: '1px dashed var(--creator-border)', borderRadius: 8 }}>
              No stored uploads yet — finish an upload first to attach it
            </div>
          ) : (
            <select
              value={submitContentId ?? ''}
              onChange={(e) => {
                setSubmitContentId(e.target.value || null);
                const picked = storedContent.find((c) => c.id === e.target.value);
                if (picked) setSubmitTitle(picked.title);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--creator-border)',
                backgroundColor: 'var(--creator-dark)',
                color: 'var(--creator-text)',
                fontSize: 14,
              }}
            >
              <option value="">No attachment (title-only entry)</option>
              {storedContent.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} · uploaded {new Date(c.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 6 }}>
            Entry Title
          </label>
          <input
            value={submitTitle}
            onChange={(e) => setSubmitTitle(e.target.value)}
            placeholder="Name your submission"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'var(--creator-dark)',
              color: 'var(--creator-text)',
              fontSize: 14,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => submitTitle && submitMutation.mutate()}
            disabled={!submitTitle || submitMutation.isPending}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--creator-border)',
              background: 'transparent',
              color: 'var(--creator-text-muted)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
        {submitMutation.isError && (
          <p style={errorTextStyle()}>{creatorApi.errorMessage(submitMutation.error)}</p>
        )}
      </div>
    </div>
  );
}
