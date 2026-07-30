export default function Loading() {
import { colors } from '@azeebo/design-tokens';
  return (
    <div style={{ minHeight: '100vh', background: colors.bg.primary, padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ height: '32px', width: '200px', background: colors.bg.secondary, borderRadius: '8px', marginBottom: '24px', animation: 'pulse 2s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '200px', background: colors.bg.secondary, borderRadius: '12px', animation: 'pulse 2s infinite' }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
