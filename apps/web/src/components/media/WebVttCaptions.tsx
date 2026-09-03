'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { webLogger } from '@/lib/logger';

export interface CaptionTrack {
  id: string;
  label: string;
  language: string;
  url: string;
  isDefault?: boolean;
}

interface WebVttCaptionsProps {
  tracks: CaptionTrack[];
  activeTrackId: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onTrackChange?: (trackId: string | null) => void;
}

interface Cue {
  start: number;
  end: number;
  text: string;
}

function parseVtt(content: string): Cue[] {
  const cues: Cue[] = [];
  const lines = content.split('\n');
  let i = 0;

  // Skip WEBVTT header
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->').map((s) => s.trim());
      const textLines: string[] = [];
      i++;

      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i].trim());
        i++;
      }

      cues.push({
        start: parseTimestamp(startStr),
        end: parseTimestamp(endStr),
        text: textLines.join('\n'),
      });
    }

    i++;
  }

  return cues;
}

function parseTimestamp(ts: string): number {
  const parts = ts.split(':');
  if (parts.length === 3) {
    const [h, m, rest] = parts;
    const [s, ms] = rest.split('.');
    return (
      parseInt(h, 10) * 3600 +
      parseInt(m, 10) * 60 +
      parseInt(s, 10) +
      parseInt((ms || '0').padEnd(3, '0').slice(0, 3), 10) / 1000
    );
  }
  if (parts.length === 2) {
    const [m, rest] = parts;
    const [s, ms] = rest.split('.');
    return (
      parseInt(m, 10) * 60 +
      parseInt(s, 10) +
      parseInt((ms || '0').padEnd(3, '0').slice(0, 3), 10) / 1000
    );
  }
  return parseFloat(ts) || 0;
}

export function WebVttCaptions({
  tracks,
  activeTrackId,
  videoRef,
  onTrackChange,
}: WebVttCaptionsProps) {
  const [cues, setCues] = useState<Cue[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const cueCacheRef = useRef<Map<string, Cue[]>>(new Map());

  // Load and parse VTT file
  const loadTrack = useCallback(async (track: CaptionTrack) => {
    if (cueCacheRef.current.has(track.id)) {
      return cueCacheRef.current.get(track.id)!;
    }

    try {
      const response = await fetch(track.url);
      if (!response.ok) throw new Error('Failed to load captions');
      const text = await response.text();
      const parsed = parseVtt(text);
      cueCacheRef.current.set(track.id, parsed);
      return parsed;
    } catch (err) {
      webLogger.error('[WebVttCaptions] Failed to load caption track:', err);
      return [];
    }
  }, []);

  // Load active track cues
  useEffect(() => {
    if (!activeTrackId) {
      setCues([]);
      setCurrentText('');
      return;
    }

    const track = tracks.find((t) => t.id === activeTrackId);
    if (!track) return;

    loadTrack(track).then(setCues);
  }, [activeTrackId, tracks, loadTrack]);

  // Update current cue based on video time
  useEffect(() => {
    const video = videoRef.current;
    if (!video || cues.length === 0) {
      setCurrentText('');
      return;
    }

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      const activeCue = cues.find((c) => time >= c.start && time <= c.end);
      setCurrentText(activeCue?.text || '');
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [cues, videoRef]);

  const handleTrackSelect = useCallback(
    (trackId: string | null) => {
      onTrackChange?.(trackId);
      setShowMenu(false);
    },
    [onTrackChange]
  );

  return (
    <div className="relative">
      {/* Caption display */}
      {currentText && (
        <div
          className="absolute bottom-16 left-1/2 -translate-x-1/2 max-w-[80%] bg-black/80 text-white px-4 py-2 rounded-lg text-center pointer-events-none z-10"
          role="region"
          aria-live="polite"
          aria-label="Captions"
        >
          <p className="text-sm md:text-base whitespace-pre-line">{currentText}</p>
        </div>
      )}

      {/* Captions toggle button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`p-2 rounded-lg transition-colors ${
          activeTrackId ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
        }`}
        aria-label={activeTrackId ? 'Captions on' : 'Captions off'}
        aria-expanded={showMenu}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 4a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H7zm5 5a1 1 0 011-1h.01a1 1 0 110 2H13a1 1 0 01-1-1zm-4 4a1 1 0 011-1h.01a1 1 0 110 2H9a1 1 0 01-1-1zm8 0a1 1 0 011-1h.01a1 1 0 110 2H17a1 1 0 01-1-1z"
          />
        </svg>
      </button>

      {/* Track selection menu */}
      {showMenu && (
        <div
          className="absolute bottom-12 right-0 bg-gray-900 rounded-lg shadow-xl border border-gray-700 min-w-[160px] z-20"
          role="menu"
          aria-label="Caption tracks"
        >
          <button
            onClick={() => handleTrackSelect(null)}
            className={`w-full px-4 py-2 text-left text-sm rounded-t-lg hover:bg-gray-800 ${
              !activeTrackId ? 'bg-blue-600 text-white' : 'text-gray-300'
            }`}
            role="menuitem"
          >
            Off
          </button>
          {tracks.map((track, index) => (
            <button
              key={track.id}
              onClick={() => handleTrackSelect(track.id)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-800 ${
                index === tracks.length - 1 ? 'rounded-b-lg' : ''
              } ${activeTrackId === track.id ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
              role="menuitem"
            >
              {track.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
