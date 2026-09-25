import { calculateCost } from '../cost-calculator';
import { getModelPricing, listModels } from '../model-pricing';

describe('Model Cost Calculator', () => {
  it('calculates cost for known Claude model', () => {
    const result = calculateCost({
      model: 'claude-haiku-3.5',
      inputTokens: 1000,
      outputTokens: 500,
      latencyMs: 120,
    });

    expect(result.knownModel).toBe(true);
    expect(result.provider).toBe('anthropic');
    expect(result.tier).toBe('T0');
    expect(result.totalTokens).toBe(1500);
    expect(result.totalCostUsd).toBeGreaterThan(0);
    expect(result.latencyMs).toBe(120);
  });

  it('calculates cost for known GPT model', () => {
    const result = calculateCost({
      model: 'gpt-4o-mini',
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    });

    expect(result.knownModel).toBe(true);
    expect(result.inputCostUsd).toBe(0.15);
    expect(result.outputCostUsd).toBe(0.6);
    expect(result.totalCostUsd).toBe(0.75);
  });

  it('handles unknown model gracefully with fallback pricing', () => {
    const result = calculateCost({
      model: 'custom-fine-tuned-model',
      inputTokens: 1000,
      outputTokens: 500,
    });

    expect(result.knownModel).toBe(false);
    expect(result.provider).toBe('unknown');
    expect(result.totalCostUsd).toBeGreaterThan(0);
  });

  it('retrieves pricing correctly from registry', () => {
    const pricing = getModelPricing('claude-haiku-3.5');
    expect(pricing).toBeDefined();
    expect(pricing?.tier).toBe('T0');
    expect(listModels().length).toBeGreaterThan(0);
  });
});
