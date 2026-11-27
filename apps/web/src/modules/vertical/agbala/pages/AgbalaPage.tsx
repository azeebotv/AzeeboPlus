'use client';

import Link from 'next/link';

const PATHS = [
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Strength, honor, and combat mastery',
    color: 'var(--color-az-category-crimson)',
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Wisdom, knowledge, and ancient truths',
    color: 'var(--color-az-category-sky)',
  },
  {
    id: 'trickster',
    name: 'Trickster',
    description: 'Cunning, deception, and survival',
    color: 'var(--color-az-accent-gold)',
  },
  {
    id: 'healer',
    name: 'Healer',
    description: 'Compassion, restoration, and balance',
    color: 'var(--color-az-success-400)',
  },
];

export default function AgbalaPage() {
  return (
    <div className="min-h-screen bg-[var(--color-az-surface-root)] text-[var(--color-az-ink)]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Agbala</h1>
          <p className="text-xl text-[var(--color-az-ink)]/50">
            Choose your path. Shape your destiny.
          </p>
        </header>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Choose Your Path</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PATHS.map((path) => (
              <Link
                key={path.id}
                href={`/vertical/agbala/${path.id}`}
                className="block p-6 rounded-lg border border-az-glass-border hover:border-az-glass-border-hover transition-colors"
                style={{ borderColor: path.color }}
              >
                <h3 className="text-xl font-semibold mb-2">{path.name}</h3>
                <p className="text-az-ink-muted">{path.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="text-center">
          <Link
            href="/vertical/agbala/quiz"
            className="inline-block px-8 py-4 bg-az-warning-500 text-black font-semibold rounded-lg hover:bg-az-warning-400 transition-colors"
          >
            Take the Destiny Quiz
          </Link>
        </section>
      </div>
    </div>
  );
}
