import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_EVENT_KEY = 'azeebo_analytics_events';
const MAX_EVENTS = 1000;
const FLUSH_INTERVAL_MS = 60000;

export interface AnalyticsEvent {
  id: string;
  name: string;
  properties: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
  userId?: string;
}

let sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
let flushTimer: ReturnType<typeof setInterval> | null = null;

export function trackEvent(name: string, properties: Record<string, unknown> = {}): void {
  const event: AnalyticsEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name,
    properties: { ...properties, platform: Platform.OS },
    timestamp: new Date().toISOString(),
    sessionId,
  };
  queueEvent(event);
}

async function queueEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_EVENT_KEY);
    const events: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    events.push(event);
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
    await AsyncStorage.setItem(ANALYTICS_EVENT_KEY, JSON.stringify(events));
  } catch { /* silent */ }
}

export async function flushEvents(endpoint: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_EVENT_KEY);
    if (!raw) return 0;
    const events: AnalyticsEvent[] = JSON.parse(raw);
    if (events.length === 0) return 0;
    const resp = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events }) });
    if (resp.ok) { await AsyncStorage.removeItem(ANALYTICS_EVENT_KEY); return events.length; }
    return 0;
  } catch { return 0; }
}

export function startAutoFlush(endpoint: string): void {
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(() => flushEvents(endpoint), FLUSH_INTERVAL_MS);
}

export function stopAutoFlush(): void {
  if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
}

export function setUserId(userId: string): void { trackEvent('identify', { userId }); }
export function trackScreen(screenName: string): void { trackEvent('screen_view', { screenName }); }
export function trackError(error: Error, context?: Record<string, unknown>): void {
  trackEvent('error', { message: error.message, stack: error.stack, ...context });
}

