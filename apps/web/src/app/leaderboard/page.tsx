'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

interface LeaderboardEntry { rank: number; userId: string; username: string; avatar?: string; score: number; level: number; badges: string[]; }

export default function LeaderboardPage(): React.JSX.Element {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');

  useEffect(() => { loadLeaderboard(); }, [timeframe]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch<any>(`/engagement/leaderboard?timeframe=${timeframe}`);
      if (response.success && response.data) {
        const data = response.data as any;
        setEntries(Array.isArray(data) ? data : data.items || []);
      }
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  const getRankStyle = (rank: number): { bg: string; color: string } => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#1A0A0A' };
    if (rank === 2) return { bg: 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)', color: '#1A0A0A' };
    if (rank === 3) return { bg: 'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)', color: '#fff' };
    return { bg: '#2A1A1A', color: '#9A8A7A' };
  };

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main style={{ paddingTop: 100, paddingBottom: 60, maxWidth: 800, margin: '0 auto', padding: '100px 24px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Leaderboard</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>Top contributors on Azeebo+</p>
        </div>

        {/* Timeframe selector */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
          {([['weekly', 'This Week'], ['monthly', 'This Month'], ['allTime', 'All Time']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTimeframe(key)} style={{ padding: '10px 24px', borderRadius: 999, border: timeframe === key ? 'none' : '1px solid #2A1A1A', background: timeframe === key ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent', color: timeframe === key ? '#fff' : '#9A8A7A', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #2A1A1A', borderTopColor: '#E8420A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
            <h3 style={{ fontSize: 18 }}>No leaderboard data yet</h3>
            <p style={{ color: '#9A8A7A', marginTop: 8 }}>Start engaging to climb the ranks!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entries.map(entry => {
              const rankStyle = getRankStyle(entry.rank);
              return (
                <div key={entry.userId} className="az-glass" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: rankStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: rankStyle.color, flexShrink: 0 }}>
                    {entry.rank}
                  </div>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: entry.rank <= 3 ? '2px solid #E8420A' : '2px solid #2A1A1A' }}>
                    {entry.avatar ? <img src={entry.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', backgroundColor: '#2A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{entry.username.charAt(0).toUpperCase()}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 600, fontSize: 15 }}>{entry.username}</h3>
                    <p style={{ color: '#9A8A7A', fontSize: 12 }}>Level {entry.level}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, fontSize: 18, color: '#E8420A' }}>{entry.score.toLocaleString()}</p>
                    <p style={{ color: '#9A8A7A', fontSize: 11 }}>pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
