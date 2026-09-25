import { SetMetadata } from '@nestjs/common';

// ─── Metadata Keys ──────────────────────────────────────────

export const TRACK_COST_OPTIONS = 'track_cost_options';

export interface TrackCostOptions {
  /** Agent ID for attribution (e.g. 'CP-01', 'EA-01') */
  agentId?: string;
  /** Business domain (e.g. 'finance', 'rights', 'customer') */
  domain?: string;
  /** Task type for classification (e.g. 'invoice_generation') */
  taskType?: string;
  /** Model tier hint (T0-T4) */
  modelTier?: string;
  /** Whether to include the full response in metadata */
  includeResponse?: boolean;
  /** Custom cost multiplier (e.g. 1.5 for premium routing) */
  costMultiplier?: number;
  /** Skip tracking (useful for conditional tracking) */
  skip?: boolean;
}

/**
 * Decorator to automatically track model costs for a method.
 *
 * The decorated method must return an object with at minimum:
 * - `model`: string (model name)
 * - `usage`: { inputTokens: number, outputTokens: number }
 *
 * Example:
 * ```typescript
 * @TrackCost({ agentId: 'EA-01', domain: 'finance', taskType: 'invoice_generation' })
 * async generateInvoice(data: InvoiceData) {
 *   const result = await this.llm.complete({
 *     model: 'claude-sonnet-4-20250514',
 *     messages: [...],
 *   });
 *   return result; // Will be automatically tracked
 * }
 * ```
 */
export const TrackCost = (options: TrackCostOptions = {}) =>
  SetMetadata(TRACK_COST_OPTIONS, options);

// ─── Response Extraction ────────────────────────────────────

export interface AIResponse {
  model?: string;
  model_used?: string;
  usage?: {
    input_tokens?: number;
    prompt_tokens?: number;
    output_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  latencyMs?: number;
  latency_ms?: number;
  [key: string]: unknown;
}

/**
 * Extract cost-relevant fields from an AI response.
 * Handles multiple provider formats (Anthropic, OpenAI, Google).
 */
export function extractAICostData(response: unknown): {
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs?: number;
} | null {
  if (!response || typeof response !== 'object') return null;
  const r = response as Record<string, unknown>;

  // Model name (multiple formats)
  const model = (r.model ?? r.model_used ?? r.modelName ?? '') as string;
  if (!model) return null;

  // Usage (multiple formats)
  const usage = r.usage as Record<string, unknown> | undefined;
  const usageAlt = r.token_usage as Record<string, unknown> | undefined;
  const u = usage ?? usageAlt;

  const inputTokens = Number(u?.input_tokens ?? u?.prompt_tokens ?? u?.inputTokens ?? 0);
  const outputTokens = Number(u?.output_tokens ?? u?.completion_tokens ?? u?.outputTokens ?? 0);

  // Latency
  const latencyMs = Number(r.latencyMs ?? r.latency_ms ?? r.duration_ms ?? undefined);

  return { model, inputTokens, outputTokens, latencyMs: latencyMs || undefined };
}

/**
 * Extract cost data from a streaming response chunk.
 * Useful for accumulating token counts across streaming chunks.
 */
export function extractStreamingChunk(chunk: unknown): {
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
  finished?: boolean;
} | null {
  if (!chunk || typeof chunk !== 'object') return null;
  const c = chunk as Record<string, unknown>;

  const delta = c.delta ?? c;
  const d = delta as Record<string, unknown>;

  return {
    model: (c.model ?? d.model) as string | undefined,
    inputTokens: Number(d.input_tokens ?? d.prompt_tokens ?? undefined) || undefined,
    outputTokens:
      Number(d.output_tokens ?? d.completion_tokens ?? d.delta_tokens ?? undefined) || undefined,
    finished: c.finished === true || c.done === true || c.stop_reason !== undefined,
  };
}
