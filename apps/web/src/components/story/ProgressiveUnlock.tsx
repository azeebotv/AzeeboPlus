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
    none: 'border-green-500/30',
    mild: 'border-yellow-500/30',
    moderate: 'border-orange-500/30',
    heavy: 'border-red-500/30',
  };

  const spoilerLabels = {
    none: 'No Spoilers',
    mild: 'Mild Spoilers',
    moderate: 'Major Spoilers',
    heavy: 'Heavy Spoilers',
  };

  if (!isUnlocked) {
    return (
      <div className="border border-gray-700 rounded-xl p-4 bg-gray-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm font-medium text-gray-400">Locked</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full border ${spoilerColors[unit.spoilerLevel]} bg-gray-800`}>
            {spoilerLabels[unit.spoilerLevel]}
          </span>
        </div>
        <h3 className="text-white font-semibold mb-1 blur-sm select-none">{unit.title}</h3>
        <p className="text-gray-500 text-sm blur-sm select-none line-clamp-2">{unit.description}</p>

        {/* Progress toward unlock */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Unlock progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {progress >= unit.requiredConsumption ? (
          <button
            onClick={handleReveal}
            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg transition-colors"
          >
            Unlock & Reveal
          </button>
        ) : (
          <button
            onClick={onConsume}
            className="mt-3 w-full bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm py-2 px-4 rounded-lg transition-colors"
          >
            Continue Watching to Unlock
          </button>
        )}
      </div>
    );
  }

  // Unlocked — show with optional reveal gate
  return (
    <div className={`border rounded-xl p-4 ${spoilerColors[unit.spoilerLevel]} bg-gray-900/30`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-green-400">Unlocked</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${spoilerColors[unit.spoilerLevel]}`}>
          {spoilerLabels[unit.spoilerLevel]}
        </span>
      </div>

      {!isRevealed && unit.spoilerLevel !== 'none' ? (
        <>
          <h3 className="text-white font-semibold mb-1">{unit.title}</h3>
          <p className="text-gray-400 text-sm mb-3">Content contains {unit.spoilerLevel} spoilers</p>
          <button
            onClick={handleReveal}
            className="w-full border border-gray-600 hover:border-gray-500 text-gray-300 text-sm py-2 px-4 rounded-lg transition-colors"
          >
            Reveal Content
          </button>
        </>
      ) : (
        <div>
          <h3 className="text-white font-semibold mb-2">{unit.title}</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{unit.description}</p>
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
    [onRevealRequest],
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
        <h2 className="text-lg font-bold text-white">What You Know</h2>
        <span className="text-sm text-gray-400">
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
