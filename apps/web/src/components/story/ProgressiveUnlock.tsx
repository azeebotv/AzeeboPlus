'use client';

import { useState, useCallback } from 'react';

/**
 * Progressive Unlock UI (AZP-STORY-006)
 * Spoiler-safe progressive knowledge unlock for storyworld content.
 * Displays content based on what the user already knows,
 * with safe reveals for newly unlocked knowledge.
 */

export interface KnowledgeUnit {
  id: string;
  title: string;
  description: string;
  spoilerLevel: 'none' | 'mild' | 'moderate' | 'heavy';
  requiredConsumption: number; // percentage of prerequisite content needed
  prerequisiteIds: string[];
}

interface ProgressiveUnlockProps {
  /** All knowledge units in the story */
  knowledgeUnits: KnowledgeUnit[];
  /** IDs of knowledge units the user has already unlocked */
  unlockedIds: Set<string>;
  /** User's consumption progress per unit (0-100) */
  consumptionProgress: Map<string, number>;
  /** Called when user requests to reveal a locked unit */
  onRevealRequest?: (unitId: string) => void;
  /** Called when user completes consumption to unlock */
  onConsumeContent?: (unitId: string) => void;
}

interface KnowledgeCardProps {
  unit: KnowledgeUnit;
  isUnlocked: boolean;
  progress: number;
  onReveal?: () => void;
  onConsume?: () => void;
}

function KnowledgeCard({ unit, isUnlocked, progress, onReveal, onConsume }: KnowledgeCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleReveal = () => {
    setIsRevealed(true);
    onReveal?.();
  };

  const spoilerColors = {
    none: 'border-az-success-500/30',
    mild: 'border-az-warning-500/30',
    moderate: 'border-az-flame/30',
    heavy: 'border-az-error-500/30',
  };

  const spoilerLabels = {
    none: 'No Spoilers',
    mild: 'Mild Spoilers',
    moderate: 'Major Spoilers',
    heavy: 'Heavy Spoilers',
  };

  if (!isUnlocked) {
    return (
      <div className="border border-az-surface-edge rounded-xl p-4 bg-az-surface-raised/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-az-ink-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="az-body-strong text-az-ink-muted">Locked</span>
          </div>
          <span
            className={`az-caption px-2 py-1 rounded-full border bg-az-surface-panel ${spoilerColors[unit.spoilerLevel]}`}
          >
            {spoilerLabels[unit.spoilerLevel]}
          </span>
        </div>
        <h3 className="text-az-ink font-semibold mb-1 blur-sm select-none">{unit.title}</h3>
        <p className="text-az-ink-muted az-body blur-sm select-none line-clamp-2">
          {unit.description}
        </p>

        {/* Progress toward unlock */}
        <div className="mt-3">
          <div className="flex justify-between az-caption text-az-ink-muted mb-1">
            <span>Unlock progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-az-surface-edge rounded-full h-1.5">
            <div
              className="bg-az-scarlet h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {progress >= unit.requiredConsumption ? (
          <button onClick={handleReveal} className="mt-3 az-btn-primary">
            Unlock & Reveal
          </button>
        ) : (
          <button onClick={onConsume} className="mt-3 az-btn-social">
            Continue Watching to Unlock
          </button>
        )}
      </div>
    );
  }

  // Unlocked — show with optional reveal gate
  return (
    <div
      className={`border rounded-xl p-4 bg-az-surface-raised/30 ${spoilerColors[unit.spoilerLevel]}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-az-success-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="az-body-strong text-az-success-400">Unlocked</span>
        </div>
        <span
          className={`az-caption px-2 py-1 rounded-full border ${spoilerColors[unit.spoilerLevel]}`}
        >
          {spoilerLabels[unit.spoilerLevel]}
        </span>
      </div>

      {!isRevealed && unit.spoilerLevel !== 'none' ? (
        <>
          <h3 className="text-az-ink font-semibold mb-1">{unit.title}</h3>
          <p className="az-body text-az-ink-muted mb-3">
            Content contains {unit.spoilerLevel} spoilers
          </p>
          <button onClick={handleReveal} className="az-btn-social">
            Reveal Content
          </button>
        </>
      ) : (
        <div>
          <h3 className="text-az-ink font-semibold mb-2">{unit.title}</h3>
          <p className="az-body text-az-ink-dim">{unit.description}</p>
        </div>
      )}
    </div>
  );
}

export function ProgressiveUnlock({
  knowledgeUnits,
  unlockedIds,
  consumptionProgress,
  onRevealRequest,
  onConsumeContent,
}: ProgressiveUnlockProps) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const handleReveal = useCallback(
    (unitId: string) => {
      setRevealedIds((prev) => new Set([...prev, unitId]));
      onRevealRequest?.(unitId);
    },
    [onRevealRequest]
  );

  // Sort: unlocked first, then by spoiler level (none first)
  const sorted = [...knowledgeUnits].sort((a, b) => {
    const aUnlocked = unlockedIds.has(a.id);
    const bUnlocked = unlockedIds.has(b.id);
    if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;

    const spoilerOrder = { none: 0, mild: 1, moderate: 2, heavy: 3 };
    return spoilerOrder[a.spoilerLevel] - spoilerOrder[b.spoilerLevel];
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="az-title text-az-ink">What You Know</h2>
        <span className="az-body text-az-ink-muted">
          {unlockedIds.size} of {knowledgeUnits.length} unlocked
        </span>
      </div>

      {sorted.map((unit) => (
        <KnowledgeCard
          key={unit.id}
          unit={unit}
          isUnlocked={unlockedIds.has(unit.id) || revealedIds.has(unit.id)}
          progress={consumptionProgress.get(unit.id) || 0}
          onReveal={() => handleReveal(unit.id)}
          onConsume={() => onConsumeContent?.(unit.id)}
        />
      ))}
    </div>
  );
}
