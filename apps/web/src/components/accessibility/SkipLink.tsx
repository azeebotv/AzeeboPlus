'use client';

export function SkipLink() {
  return (
    <a
      href="#main-content"
      style={{
        position: 'absolute',
        top: -40,
        left: 0,
        background: 'var(--color-az-flame)',
        color: 'var(--color-az-ink)',
        padding: '8px 16px',
        zIndex: 100,
        textDecoration: 'none',
        fontWeight: 600,
        borderRadius: 'var(--radius-az-control)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '0';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px';
      }}
    >
      Skip to main content
    </a>
  );
}
