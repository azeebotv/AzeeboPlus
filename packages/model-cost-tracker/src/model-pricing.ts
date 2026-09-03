/**
 * Model Pricing Tables
 *
 * Prices in USD per 1M tokens.
 * Updated: August 2026
 *
 * Source: Anthropic, OpenAI, Google pricing pages
 */

export interface ModelPricing {
  model: string;
  provider: string;
  tier: string; // T0-T4
  inputCostPer1M: number;
  outputCostPer1M: number;
  maxContext: number;
  description: string;
}

// ─── Claude Models (Anthropic) ──────────────────────────────

export const CLAUDE_PRICING: Record<string, ModelPricing> = {
  'claude-haiku-3.5': {
    model: 'claude-haiku-3.5',
    provider: 'anthropic',
    tier: 'T0',
    inputCostPer1M: 0.80,
    outputCostPer1M: 4.00,
    maxContext: 200_000,
    description: 'Fastest, cheapest — classification, extraction, routing',
  },
  'claude-sonnet-4-20250514': {
    model: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
    tier: 'T2',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    maxContext: 200_000,
    description: 'Balanced — general purpose, drafting, summarisation',
  },
  'claude-opus-4-20250514': {
    model: 'claude-opus-4-20250514',
    provider: 'anthropic',
    tier: 'T3',
    inputCostPer1M: 15.00,
    outputCostPer1M: 75.00,
    maxContext: 200_000,
    description: 'Most capable — complex reasoning, synthesis, code',
  },
};

// ─── GPT Models (OpenAI) ───────────────────────────────────

export const GPT_PRICING: Record<string, ModelPricing> = {
  'gpt-4o-mini': {
    model: 'gpt-4o-mini',
    provider: 'openai',
    tier: 'T0',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    maxContext: 128_000,
    description: 'Fastest, cheapest — classification, extraction',
  },
  'gpt-4o': {
    model: 'gpt-4o',
    provider: 'openai',
    tier: 'T2',
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    maxContext: 128_000,
    description: 'Balanced — general purpose, multimodal',
  },
  'gpt-4-turbo': {
    model: 'gpt-4-turbo',
    provider: 'openai',
    tier: 'T3',
    inputCostPer1M: 10.00,
    outputCostPer1M: 30.00,
    maxContext: 128_000,
    description: 'Complex reasoning, code, analysis',
  },
};

// ─── Gemini Models (Google) ─────────────────────────────────

export const GEMINI_PRICING: Record<string, ModelPricing> = {
  'gemini-1.5-flash': {
    model: 'gemini-1.5-flash',
    provider: 'google',
    tier: 'T0',
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
    maxContext: 1_000_000,
    description: 'Fastest, cheapest — classification, extraction',
  },
  'gemini-1.5-pro': {
    model: 'gemini-1.5-pro',
    provider: 'google',
    tier: 'T2',
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
    maxContext: 2_000_000,
    description: 'Balanced — long context, analysis',
  },
};

// ─── Combined Pricing Table ─────────────────────────────────

export const ALL_MODELS: Record<string, ModelPricing> = {
  ...CLAUDE_PRICING,
  ...GPT_PRICING,
  ...GEMINI_PRICING,
};

// ─── Tier Defaults ──────────────────────────────────────────

export const TIER_DEFAULTS: Record<string, string> = {
  T0: 'claude-haiku-3.5',    // Cheapest reliable
  T1: 'claude-haiku-3.5',    // Classification/extraction
  T2: 'claude-sonnet-4-20250514', // General purpose
  T3: 'claude-sonnet-4-20250514', // Complex reasoning
  T4: 'claude-opus-4-20250514',   // Premium reasoning
};

// ─── Helpers ────────────────────────────────────────────────

export function getModelPricing(model: string): ModelPricing | undefined {
  return ALL_MODELS[model];
}

export function getTierDefault(tier: string): string {
  return TIER_DEFAULTS[tier] ?? TIER_DEFAULTS['T2'];
}

export function getProvider(model: string): string {
  return ALL_MODELS[model]?.provider ?? 'unknown';
}

export function listModels(provider?: string): ModelPricing[] {
  const models = Object.values(ALL_MODELS);
  return provider ? models.filter((m) => m.provider === provider) : models;
}
