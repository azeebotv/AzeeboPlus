import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface OnboardingWizardProps {
  /** Number of published/uploaded items — 0 means the creator is fresh. */
  contentCount: number;
}

const STEPS = [
  { key: 'profile', label: 'Complete your creator profile', href: '/settings' },
  { key: 'upload', label: 'Upload your first content', href: '/upload' },
  { key: 'payouts', label: 'Set up payout details', href: '/settings' },
] as const;

/**
 * First-run checklist for new creators. Rendered only when the
 * `creator_onboarding_wizard` flag is enabled AND the creator has no content.
 */
export function OnboardingWizard({ contentCount }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || contentCount > 0) return null;

  return (
    <div
      style={{
        marginBottom: 24,
        padding: 20,
        borderRadius: 16,
        border: '1px solid var(--creator-orange)',
        background: 'linear-gradient(135deg, rgba(232,66,10,0.12), rgba(204,28,28,0.08))',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
            Welcome to your creator studio 🎬
          </h2>
          <p style={{ fontSize: 13, color: 'var(--creator-text-muted)' }}>
            Complete these steps to start growing your audience:
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--creator-border)',
            background: 'transparent',
            color: 'var(--creator-text-muted)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {STEPS.map((step, i) => (
          <button
            key={step.key}
            onClick={() => navigate(step.href)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--creator-border)',
              background: 'rgba(13,5,5,0.4)',
              color: 'var(--creator-text)',
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                color: 'white',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {i + 1}
            </span>
            {step.label}
            <span style={{ marginLeft: 'auto', color: 'var(--creator-orange)', fontSize: 12 }}>Start →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
