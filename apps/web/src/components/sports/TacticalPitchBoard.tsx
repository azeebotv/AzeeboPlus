'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users } from 'lucide-react';

export interface PlayerLineup {
  number: number;
  name: string;
  position: string;
  gridX: number; // 0 to 100% horizontal
  gridY: number; // 0 to 100% vertical
  isCaptain?: boolean;
  rating?: number;
}

export interface MatchStats {
  possession: [number, number]; // [home, away]
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  passAccuracy: [number, number];
}

interface TacticalPitchBoardProps {
  homeTeam: string;
  awayTeam: string;
  formation?: string;
  stats?: MatchStats;
}

const DEFAULT_HOME_PLAYERS: PlayerLineup[] = [
  { number: 24, name: 'Onana', position: 'GK', gridX: 50, gridY: 90, rating: 7.2 },
  { number: 20, name: 'Dalot', position: 'RB', gridX: 85, gridY: 72, rating: 7.4 },
  { number: 19, name: 'Varane', position: 'CB', gridX: 63, gridY: 75, rating: 7.1 },
  { number: 6, name: 'Martinez', position: 'CB', gridX: 37, gridY: 75, rating: 7.5 },
  { number: 23, name: 'Shaw', position: 'LB', gridX: 15, gridY: 72, rating: 7.0 },
  { number: 18, name: 'Casemiro', position: 'CDM', gridX: 38, gridY: 55, rating: 7.6 },
  { number: 37, name: 'Mainoo', position: 'CDM', gridX: 62, gridY: 55, rating: 7.8 },
  { number: 17, name: 'Garnacho', position: 'RW', gridX: 82, gridY: 34, rating: 7.7 },
  {
    number: 8,
    name: 'B. Fernandes',
    position: 'CAM',
    gridX: 50,
    gridY: 38,
    isCaptain: true,
    rating: 8.3,
  },
  { number: 10, name: 'Rashford', position: 'LW', gridX: 18, gridY: 34, rating: 7.4 },
  { number: 11, name: 'Hojlund', position: 'ST', gridX: 50, gridY: 15, rating: 7.9 },
];

const DEFAULT_AWAY_PLAYERS: PlayerLineup[] = [
  { number: 31, name: 'Ederson', position: 'GK', gridX: 50, gridY: 90, rating: 7.3 },
  { number: 2, name: 'Walker', position: 'RB', gridX: 85, gridY: 72, isCaptain: true, rating: 7.6 },
  { number: 3, name: 'Dias', position: 'CB', gridX: 63, gridY: 75, rating: 7.8 },
  { number: 5, name: 'Stones', position: 'CB', gridX: 37, gridY: 75, rating: 7.5 },
  { number: 24, name: 'Gvardiol', position: 'LB', gridX: 15, gridY: 72, rating: 7.4 },
  { number: 16, name: 'Rodri', position: 'CDM', gridX: 50, gridY: 56, rating: 8.5 },
  { number: 20, name: 'B. Silva', position: 'CM', gridX: 65, gridY: 45, rating: 7.9 },
  { number: 17, name: 'De Bruyne', position: 'CAM', gridX: 35, gridY: 42, rating: 8.6 },
  { number: 47, name: 'Foden', position: 'RW', gridX: 82, gridY: 30, rating: 8.2 },
  { number: 10, name: 'Grealish', position: 'LW', gridX: 18, gridY: 30, rating: 7.5 },
  { number: 9, name: 'Haaland', position: 'ST', gridX: 50, gridY: 14, rating: 8.4 },
];

const BENCH_PLAYERS = {
  home: [
    { number: 1, name: 'Bayindir', position: 'GK' },
    { number: 5, name: 'Maguire', position: 'DEF' },
    { number: 29, name: 'Wan-Bissaka', position: 'DEF' },
    { number: 14, name: 'Eriksen', position: 'MID' },
    { number: 39, name: 'McTominay', position: 'MID' },
    { number: 16, name: 'Diallo', position: 'FWD' },
    { number: 21, name: 'Antony', position: 'FWD' },
  ],
  away: [
    { number: 18, name: 'Ortega', position: 'GK' },
    { number: 25, name: 'Akanji', position: 'DEF' },
    { number: 6, name: 'Ake', position: 'DEF' },
    { number: 8, name: 'Kovacic', position: 'MID' },
    { number: 27, name: 'Nunes', position: 'MID' },
    { number: 19, name: 'Alvarez', position: 'FWD' },
    { number: 52, name: 'Bobb', position: 'FWD' },
  ],
};

const DEFAULT_STATS: MatchStats = {
  possession: [58, 42],
  shots: [15, 11],
  shotsOnTarget: [6, 4],
  passAccuracy: [88, 83],
  corners: [7, 5],
  fouls: [10, 12],
  yellowCards: [2, 3],
  redCards: [0, 0],
};

export function TacticalPitchBoard({
  homeTeam,
  awayTeam,
  formation = '4-2-3-1',
  stats = DEFAULT_STATS,
}: TacticalPitchBoardProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'lineup' | 'stats'>('lineup');
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerLineup | null>(null);

  const players = selectedTeam === 'home' ? DEFAULT_HOME_PLAYERS : DEFAULT_AWAY_PLAYERS;
  const currentTeamName = selectedTeam === 'home' ? homeTeam : awayTeam;
  const currentBench = selectedTeam === 'home' ? BENCH_PLAYERS.home : BENCH_PLAYERS.away;

  return (
    <div className="rounded-az-card border border-az-glass-border bg-az-glass-card overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-az-glass-border p-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-az-control bg-az-flame/15 text-az-flame">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="az-subtitle text-az-ink">Tactical Lineup & Match Center</h3>
            <p className="az-caption text-az-ink-muted">
              Formation: {formation} • Matchday Strategy
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="mt-3 flex items-center rounded-az-pill bg-az-surface-root p-1 sm:mt-0">
          <button
            type="button"
            onClick={() => setActiveTab('lineup')}
            className={`rounded-az-pill px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'lineup'
                ? 'bg-az-flame text-az-surface-root shadow-sm'
                : 'text-az-ink-muted hover:text-az-ink'
            }`}
          >
            Tactical Pitch
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`rounded-az-pill px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'stats'
                ? 'bg-az-flame text-az-surface-root shadow-sm'
                : 'text-az-ink-muted hover:text-az-ink'
            }`}
          >
            Match Stats
          </button>
        </div>
      </div>

      {activeTab === 'lineup' ? (
        <div className="p-4 sm:p-6">
          {/* Team Toggle */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedTeam('home');
                setSelectedPlayer(null);
              }}
              className={`rounded-az-pill px-5 py-2 text-xs font-semibold transition-all ${
                selectedTeam === 'home'
                  ? 'border border-az-flame/40 bg-az-flame/20 text-az-flame shadow-sm'
                  : 'border border-az-glass-border bg-az-surface-root text-az-ink-muted hover:text-az-ink'
              }`}
            >
              {homeTeam} (Home)
            </button>
            <span className="text-xs text-az-ink-muted">vs</span>
            <button
              type="button"
              onClick={() => {
                setSelectedTeam('away');
                setSelectedPlayer(null);
              }}
              className={`rounded-az-pill px-5 py-2 text-xs font-semibold transition-all ${
                selectedTeam === 'away'
                  ? 'border border-az-flame/40 bg-az-flame/20 text-az-flame shadow-sm'
                  : 'border border-az-glass-border bg-az-surface-root text-az-ink-muted hover:text-az-ink'
              }`}
            >
              {awayTeam} (Away)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* The Pitch */}
            <div className="lg:col-span-2 relative aspect-[3/4] w-full max-w-lg mx-auto rounded-az-card border border-az-success-600/30 bg-az-surface-panel p-4 shadow-inner overflow-hidden">
              {/* Pitch Grass Lines & Texture */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-az-surface-panel via-az-surface-root to-az-surface-root" />

              {/* Outer boundary */}
              <div className="absolute inset-3 rounded-lg border-2 border-white/20 pointer-events-none" />

              {/* Center Circle & Halfway Line */}
              <div className="absolute top-1/2 left-3 right-3 h-[2px] bg-white/20 pointer-events-none -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 pointer-events-none" />

              {/* Top Penalty Box (Opponent End) */}
              <div className="absolute top-3 left-1/2 h-28 w-56 -translate-x-1/2 border-b-2 border-x-2 border-white/20 pointer-events-none" />
              <div className="absolute top-3 left-1/2 h-14 w-28 -translate-x-1/2 border-b-2 border-x-2 border-white/20 pointer-events-none" />

              {/* Bottom Penalty Box (Our Goal End) */}
              <div className="absolute bottom-3 left-1/2 h-28 w-56 -translate-x-1/2 border-t-2 border-x-2 border-white/20 pointer-events-none" />
              <div className="absolute bottom-3 left-1/2 h-14 w-28 -translate-x-1/2 border-t-2 border-x-2 border-white/20 pointer-events-none" />

              {/* Player Pins */}
              {players.map((player) => {
                const isSelected = selectedPlayer?.number === player.number;
                return (
                  <motion.button
                    key={player.number}
                    type="button"
                    onClick={() => setSelectedPlayer(player)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ left: `${player.gridX}%`, top: `${player.gridY}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer focus:outline-none"
                  >
                    <div
                      className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full font-bold text-xs shadow-md transition-all ${
                        isSelected
                          ? 'bg-az-flame text-az-surface-root ring-4 ring-az-flame/30 scale-110'
                          : player.position === 'GK'
                            ? 'bg-az-warning-500 text-black border border-az-warning-300'
                            : 'bg-white text-az-surface-root hover:bg-az-success-100'
                      }`}
                    >
                      {player.number}
                      {player.isCaptain && (
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-az-warning-400 text-[8px] font-black text-black">
                          C
                        </span>
                      )}
                    </div>
                    <span className="mt-1 rounded px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold text-white bg-black/60 backdrop-blur-sm whitespace-nowrap">
                      {player.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Tactical Info & Bench Panel */}
            <div className="flex flex-col gap-4">
              {/* Selected Player Detail Card */}
              <AnimatePresence mode="wait">
                {selectedPlayer ? (
                  <motion.div
                    key={selectedPlayer.number}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="rounded-az-control border border-az-glass-border bg-az-surface-root p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-az-pill bg-az-flame/20 px-2.5 py-0.5 text-xs font-semibold text-az-flame">
                        Position: {selectedPlayer.position}
                      </span>
                      {selectedPlayer.rating && (
                        <span className="text-xs font-bold text-az-success-400">
                          Rating: {selectedPlayer.rating}★
                        </span>
                      )}
                    </div>
                    <h4 className="az-subtitle text-az-ink font-bold">
                      #{selectedPlayer.number} {selectedPlayer.name}
                    </h4>
                    <p className="az-caption text-az-ink-muted mt-1">
                      {currentTeamName} • Starting XI
                    </p>
                  </motion.div>
                ) : (
                  <div className="rounded-az-control border border-dashed border-az-glass-border bg-az-surface-root/50 p-4 text-center">
                    <p className="az-caption text-az-ink-muted">
                      Tap any player pin on the pitch to inspect detailed position & ratings.
                    </p>
                  </div>
                )}
              </AnimatePresence>

              {/* Substitutes Bench List */}
              <div className="rounded-az-control border border-az-glass-border bg-az-surface-root p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-az-flame" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-az-ink">
                    Substitutes Bench ({currentTeamName})
                  </h4>
                </div>
                <div className="space-y-2">
                  {currentBench.map((benchPlayer) => (
                    <div
                      key={benchPlayer.number}
                      className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-az-glass-card transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-az-ink-muted w-5">
                          #{benchPlayer.number}
                        </span>
                        <span className="font-medium text-az-ink">{benchPlayer.name}</span>
                      </div>
                      <span className="text-[10px] text-az-ink-muted uppercase">
                        {benchPlayer.position}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Match Statistics Bars Tab */
        <div className="p-6 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-xs font-bold text-az-ink mb-4">
            <span className="text-az-flame">{homeTeam}</span>
            <span className="text-az-ink-muted">Comparison</span>
            <span className="text-az-secondary-400">{awayTeam}</span>
          </div>

          {[
            {
              label: 'Ball Possession',
              home: stats.possession[0],
              away: stats.possession[1],
              unit: '%',
            },
            { label: 'Total Shots', home: stats.shots[0], away: stats.shots[1] },
            {
              label: 'Shots on Target',
              home: stats.shotsOnTarget[0],
              away: stats.shotsOnTarget[1],
            },
            {
              label: 'Pass Accuracy',
              home: stats.passAccuracy[0],
              away: stats.passAccuracy[1],
              unit: '%',
            },
            { label: 'Corner Kicks', home: stats.corners[0], away: stats.corners[1] },
            { label: 'Fouls Committed', home: stats.fouls[0], away: stats.fouls[1] },
            { label: 'Yellow Cards', home: stats.yellowCards[0], away: stats.yellowCards[1] },
          ].map((item, idx) => {
            const total = item.home + item.away || 1;
            const homePercent = (item.home / total) * 100;
            const awayPercent = (item.away / total) * 100;

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-az-ink">
                  <span>
                    {item.home}
                    {item.unit || ''}
                  </span>
                  <span className="text-az-ink-muted">{item.label}</span>
                  <span>
                    {item.away}
                    {item.unit || ''}
                  </span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-az-surface-root">
                  <div
                    style={{ width: `${homePercent}%` }}
                    className="bg-az-flame transition-all duration-500"
                  />
                  <div
                    style={{ width: `${awayPercent}%` }}
                    className="bg-az-secondary-500 transition-all duration-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
