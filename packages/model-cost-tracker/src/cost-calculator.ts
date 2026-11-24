import { ALL_MODELS, getModelPricing, type ModelPricing } from './model-pricing';

// ─── Cost Calculation ───────────────────────────────────────

export interface CostBreakdown {
  model: string;
  provider: string;
  tier: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
  latencyMs?: number;
  costPerToken: number;
  knownModel: boolean;
}

/**
 * Calculate the exact USD cost for a model invocation.
 *
 * If the model is not in the pricing table, returns a conservative
 * estimate based on the tier default and logs a warning.
 */
export function calculateCost(params: {
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs?: number;
}): CostBreakdown {
  const pricing = getModelPricing(params.model);
  const totalTokens = params.inputTokens + params.outputTokens;

  if (pricing) {
    const inputCost = (params.inputTokens / 1_000_000) * pricing.inputCostPer1M;
    const outputCost = (params.outputTokens / 1_000_000) * pricing.outputCostPer1M;
    const totalCost = inputCost + outputCost;

    return {
      model: params.model,
      provider: pricing.provider,
      tier: pricing.tier,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      totalTokens,
      inputCostUsd: round8(inputCost),
      outputCostUsd: round8(outputCost),
      totalCostUsd: round8(totalCost),
      latencyMs: params.latencyMs,
      costPerToken: totalTokens > 0 ? round8(totalCost / totalTokens) : 0,
      knownModel: true,
    };
  }

  // Unknown model — estimate based on average T2 pricing
  const estimatedInputCost = (params.inputTokens / 1_000_000) * 2.5;
  const estimatedOutputCost = (params.outputTokens / 1_000_000) * 10.0;
  const estimatedTotal = estimatedInputCost + estimatedOutputCost;

  return {
    model: params.model,
    provider: 'unknown',
    tier: 'T2',
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    totalTokens,
    inputCostUsd: round8(estimatedInputCost),
    outputCostUsd: round8(estimatedOutputCost),
    totalCostUsd: round8(estimatedTotal),
    latencyMs: params.latencyMs,
    costPerToken: totalTokens > 0 ? round8(estimatedTotal / totalTokens) : 0,
    knownModel: false,
  };
}

/**
 * Estimate cost before making a call (for budget checks).
 */
export function estimateCost(params: {
  model: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
}): CostBreakdown {
  return calculateCost({
    model: params.model,
    inputTokens: params.estimatedInputTokens,
    outputTokens: params.estimatedOutputTokens,
  });
}

/**
 * Calculate cost savings from using a cheaper model tier.
 */
export function calculateSavings(params: {
  currentModel: string;
  alternativeModel: string;
  inputTokens: number;
  outputTokens: number;
}): {
  currentCost: number;
  alternativeCost: number;
  savingsUsd: number;
  savingsPercent: number;
} {
  const current = calculateCost({ ...params, model: params.currentModel });
  const alternative = calculateCost({ ...params, model: params.alternativeModel });

  const savings = current.totalCostUsd - alternative.totalCostUsd;
  const savingsPercent = current.totalCostUsd > 0 ? (savings / current.totalCostUsd) * 100 : 0;

  return {
    currentCost: current.totalCostUsd,
    alternativeCost: alternative.totalCostUsd,
    savingsUsd: round8(savings),
    savingsPercent: round2(savingsPercent),
  };
}

/**
 * Get the cheapest model for a given tier that meets requirements.
 */
export function getCheapestForTier(
  tier: string,
  options?: { provider?: string; maxContext?: number }
): ModelPricing | undefined {
  const candidates = Object.values(ALL_MODELS).filter((m) => {
    if (m.tier !== tier) return false;
    if (options?.provider && m.provider !== options.provider) return false;
    if (options?.maxContext && m.maxContext < options.maxContext) return false;
    return true;
  });

  return candidates.sort(
    (a, b) => a.inputCostPer1M + a.outputCostPer1M - (b.inputCostPer1M + b.outputCostPer1M)
  )[0];
}

// ─── Formatting ─────────────────────────────────────────────

export function formatCost(usd: number): string {
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  if (usd < 1) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return `${tokens}`;
}

// ─── Internal ───────────────────────────────────────────────

function round8(n: number): number {
  return Math.round(n * 100_000_000) / 100_000_000;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
