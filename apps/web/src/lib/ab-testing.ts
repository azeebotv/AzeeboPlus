export interface Experiment {
  id: string;
  name: string;
  variants: Variant[];
  traffic: number; // 0-100 percentage of users to include
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface Variant {
  id: string;
  name: string;
  weight: number; // Relative weight for distribution
  config: Record<string, unknown>;
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  userId: string;
  timestamp: number;
  event?: string;
  value?: number;
}

// In-memory experiment store (would be from API in production)
const experiments: Map<string, Experiment> = new Map();
const userAssignments: Map<string, Map<string, string>> = new Map();
const results: ExperimentResult[] = [];

// Initialize with some default experiments
function initializeExperiments() {
  const defaultExperiments: Experiment[] = [
    {
      id: 'homepage-hero-variant',
      name: 'Homepage Hero Banner Variant',
      variants: [
        { id: 'control', name: 'Original Hero', weight: 50, config: { heroStyle: 'original' } },
        { id: 'variant-a', name: 'New Hero Design', weight: 50, config: { heroStyle: 'new' } },
      ],
      traffic: 100,
      startDate: '2026-09-01',
      isActive: true,
    },
    {
      id: 'pricing-page-layout',
      name: 'Pricing Page Layout Test',
      variants: [
        { id: 'control', name: 'Original Layout', weight: 33, config: { layout: 'original' } },
        { id: 'variant-a', name: 'Card Layout', weight: 33, config: { layout: 'cards' } },
        { id: 'variant-b', name: 'Table Layout', weight: 34, config: { layout: 'table' } },
      ],
      traffic: 50,
      startDate: '2026-09-01',
      isActive: true,
    },
    {
      id: 'cta-button-color',
      name: 'CTA Button Color Test',
      variants: [
        { id: 'control', name: 'Orange CTA', weight: 50, config: { ctaColor: '#E8420A' } },
        { id: 'variant-a', name: 'Green CTA', weight: 50, config: { ctaColor: '#10B981' } },
      ],
      traffic: 100,
      startDate: '2026-09-01',
      isActive: true,
    },
  ];

  defaultExperiments.forEach((exp) => experiments.set(exp.id, exp));
}

// Initialize on load
initializeExperiments();

// Generate a deterministic user ID based on browser fingerprint
function getUserId(): string {
  if (typeof window === 'undefined') return 'server';

  let userId = localStorage.getItem('ab_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('ab_user_id', userId);
  }
  return userId;
}

// Simple hash function for deterministic assignment
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Get variant assignment for a user and experiment
export function getVariant(experimentId: string): Variant | null {
  const experiment = experiments.get(experimentId);
  if (!experiment || !experiment.isActive) return null;

  // Check if already assigned
  const userId = getUserId();
  const userExperiments = userAssignments.get(userId) || new Map();
  const existingAssignment = userExperiments.get(experimentId);

  if (existingAssignment) {
    const variant = experiment.variants.find((v) => v.id === existingAssignment);
    if (variant) return variant;
  }

  // Check if user is in traffic allocation
  const userHash = hashString(`${userId}_${experimentId}`);
  const trafficBucket = userHash % 100;
  if (trafficBucket >= experiment.traffic) return null;

  // Assign variant based on weights
  const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
  let random = userHash % totalWeight;

  for (const variant of experiment.variants) {
    random -= variant.weight;
    if (random < 0) {
      // Store assignment
      userExperiments.set(experimentId, variant.id);
      userAssignments.set(userId, userExperiments);
      return variant;
    }
  }

  // Fallback to first variant
  return experiment.variants[0];
}

// Get config value for a specific key in an experiment
export function getExperimentConfig<T>(experimentId: string, key: string, defaultValue: T): T {
  const variant = getVariant(experimentId);
  if (!variant) return defaultValue;
  return (variant.config[key] as T) ?? defaultValue;
}

// Track an experiment event
export function trackExperimentEvent(experimentId: string, event: string, value?: number): void {
  const userId = getUserId();
  const variant = getVariant(experimentId);

  if (!variant) return;

  const result: ExperimentResult = {
    experimentId,
    variantId: variant.id,
    userId,
    timestamp: Date.now(),
    event,
    value,
  };

  results.push(result);

  // In production, this would send to analytics API
  void result; // Track locally in dev, send to analytics in production
}

// Get all active experiments
export function getActiveExperiments(): Experiment[] {
  return Array.from(experiments.values()).filter((exp) => exp.isActive);
}

// Get experiment results (for admin dashboard)
export function getExperimentResults(experimentId: string): ExperimentResult[] {
  return results.filter((r) => r.experimentId === experimentId);
}

// Check if user is in a specific variant
export function isInVariant(experimentId: string, variantId: string): boolean {
  const variant = getVariant(experimentId);
  return variant?.id === variantId || false;
}

// React hook for A/B testing
export function useExperiment(experimentId: string) {
  const variant = getVariant(experimentId);

  return {
    variant,
    variantId: variant?.id || 'control',
    config: variant?.config || {},
    trackEvent: (event: string, value?: number) => trackExperimentEvent(experimentId, event, value),
  };
}
