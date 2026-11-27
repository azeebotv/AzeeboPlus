'use client';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export default function SectionHeader({ title, subtitle }: SectionHeaderProps): React.JSX.Element {
  return (
    <div className="mb-3">
      <h2 className="az-title text-az-ink">{title}</h2>
      {subtitle && <p className="az-caption mt-0.5 text-az-ink-muted">{subtitle}</p>}
    </div>
  );
}
