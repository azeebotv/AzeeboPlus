import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

export interface Span {
  traceId: string;
  spanId: string;
  parentId?: string;
  name: string;
  service: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, string | number | boolean>;
  logs: Array<{ timestamp: number; fields: Record<string, unknown> }>;
  status: 'started' | 'ended' | 'error';
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentId?: string;
  sampled?: boolean;
}

export interface TracingConfig {
  serviceName: string;
  exporterUrl?: string;
  sampleRate?: number;
  enabled?: boolean;
}

@Injectable()
export class TracingService {
  private readonly config: Required<TracingConfig>;
  private readonly activeSpans: Map<string, Span> = new Map();
  private static readonly MAX_ACTIVE_SPANS = 10000;
  private readonly asyncLocalStorage = new AsyncLocalStorage<TraceContext>();
  private exporters: Array<(span: Span) => void> = [];

  constructor(config?: Partial<TracingConfig>) {
    this.config = {
      serviceName: config?.serviceName || 'unknown-service',
      exporterUrl: config?.exporterUrl || 'http://localhost:9411/api/traces',
      sampleRate: config?.sampleRate || 1.0,
      enabled: config?.enabled ?? true,
    };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getServiceName(): string {
    return this.config.serviceName;
  }

  generateTraceId(): string {
    return randomUUID();
  }

  generateSpanId(): string {
    return randomUUID().replace(/-/g, '').slice(0, 16);
  }

  startSpan(
    name: string,
    parentContext?: TraceContext,
    tags?: Record<string, string | number | boolean>
  ): Span {
    if (!this.shouldSample()) {
      const partialSpan: Span = {
        traceId: parentContext?.traceId || this.generateTraceId(),
        spanId: this.generateSpanId(),
        parentId: parentContext?.spanId,
        name,
        service: this.config.serviceName,
        startTime: Date.now(),
        tags: tags || {},
        logs: [],
        status: 'started',
      };
      return partialSpan;
    }

    const span: Span = {
      traceId: parentContext?.traceId || this.generateTraceId(),
      spanId: this.generateSpanId(),
      parentId: parentContext?.spanId,
      name,
      service: this.config.serviceName,
      startTime: Date.now(),
      tags: tags || {},
      logs: [],
      status: 'started',
    };

    if (this.activeSpans.size >= TracingService.MAX_ACTIVE_SPANS) {
      const oldestKey = this.activeSpans.keys().next().value;
      if (oldestKey !== undefined) {
        this.activeSpans.delete(oldestKey);
      }
    }
    this.activeSpans.set(span.spanId, span);
    this.asyncLocalStorage.enterWith({ traceId: span.traceId, spanId: span.spanId, parentId: span.parentId });
    return span;
  }

  endSpan(span: Span, error?: Error): void {
    if (span.status === 'ended') {
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = error ? 'error' : 'ended';

    if (error) {
      span.tags['error'] = true;
      span.tags['error.message'] = error.message;
      span.tags['error.stack'] = error.stack || '';
    }

    this.activeSpans.delete(span.spanId);

    for (const exporter of this.exporters) {
      try {
        exporter(span);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Span export failed:', err);
      }
    }
  }

  addSpanTag(span: Span, key: string, value: string | number | boolean): void {
    span.tags[key] = value;
  }

  addSpanLog(span: Span, fields: Record<string, unknown>, timestamp?: number): void {
    span.logs.push({
      timestamp: timestamp || Date.now(),
      fields,
    });
  }

  recordException(span: Span, exception: Error): void {
    span.tags['error'] = true;
    span.tags['error.kind'] = exception.constructor.name;
    span.tags['error.message'] = exception.message;
    span.tags['error.stack'] = exception.stack || '';
    span.status = 'error';
  }

  createChildSpan(
    name: string,
    parentSpan: Span,
    tags?: Record<string, string | number | boolean>
  ): Span {
    return this.startSpan(name, { traceId: parentSpan.traceId, spanId: parentSpan.spanId }, tags);
  }

  getCurrentTraceContext(): TraceContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  addExporter(exporter: (span: Span) => void): void {
    this.exporters.push(exporter);
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  async executeWithTrace<T>(
    name: string,
    fn: (span: Span) => T,
    parentContext?: TraceContext,
    tags?: Record<string, string | number | boolean>
  ): Promise<T> {
    const span = this.startSpan(name, parentContext, tags);

    try {
      const result = fn(span);
      if (result instanceof Promise) {
        return result
          .then((resolved) => {
            this.endSpan(span);
            return resolved;
          })
          .catch((error) => {
            this.recordException(span, error);
            this.endSpan(span, error);
            throw error;
          });
      }

      this.endSpan(span);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.recordException(span, error);
      }
      this.endSpan(span, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  getActiveSpans(): Span[] {
    return Array.from(this.activeSpans.values());
  }
}

export const createTracingService = (config?: Partial<TracingConfig>): TracingService => {
  return new TracingService(config);
};
