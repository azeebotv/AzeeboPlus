import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        border: '1px dashed var(--creator-border, rgba(255,255,255,0.08))',
        backgroundColor: 'rgba(255,255,255,0.01)',
      }}
    >
      {icon && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.04)',
            color: 'var(--creator-text-muted, #9a8a7a)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--creator-text, #f5f0eb)', marginBottom: 6 }}>
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 14,
            color: 'var(--creator-text-muted, #9a8a7a)',
            maxWidth: 400,
            lineHeight: 1.5,
            marginBottom: action ? 20 : 0,
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
