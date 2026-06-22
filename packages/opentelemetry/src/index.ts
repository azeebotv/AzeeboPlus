import { NodeSDK } from '@opentelemetry/sdk-node';
import { ParentBased, TraceIdRatioBased } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { SpanStatusCode, Span } from '@opentelemetry/api';

export interface OpenTelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  otlpEndpoint?: string;
  environment?: string;
  samplingRatio?: number;
}

const DEFAULT_CONFIG: OpenTelemetryConfig = {
  serviceName: 'azeebo-service',
  serviceVersion: '1.0.0',
  otlpEndpoint: process.env.OTLP_ENDPOINT || 'http://otel-collector.azeebo-monitoring.svc.cluster.local:4318',
  environment: process.env.NODE_ENV || 'development',
  samplingRatio: 1.0,
};

export function initializeOpenTelemetry(config: Partial<OpenTelemetryConfig> = {}): NodeSDK {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const traceExporter = new OTLPTraceExporter({
    url: `${finalConfig.otlpEndpoint}/v1/traces`,
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: finalConfig.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: finalConfig.serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: finalConfig.environment,
    }),
    traceExporter,
    sampler: ParentBased({ root: TraceIdRatioBased(finalConfig.samplingRatio!) }),
  });

  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation({
        requestHook: (span: Span, request: { path: string }) => {
          span.setAttribute('http.request.path', request.path);
        },
      }),
      new ExpressInstrumentation({
        requestHook: (span: Span, request: { path: string; method: string }) => {
          span.setAttribute('http.route', request.path);
          span.setAttribute('http.method', request.method);
        },
      }),
      new PrismaInstrumentation(),
    ],
  });

  return sdk;
}

export function createTracedHttpClient(baseUrl: string) {
  return {
    async request(method: string, path: string, options: RequestInit = {}) {
      const tracer = require('@opentelemetry/api').trace.getTracer('http-client');
      return tracer.startActiveSpan(`HTTP ${method}`, { attributes: { 'http.url': `${baseUrl}${path}` } }, async (span: Span) => {
        try {
          const response = await fetch(`${baseUrl}${path}`, {
            method,
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
            },
          });
          span.setAttribute('http.status_code', response.status);
          if (!response.ok) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${response.status}` });
          }
          const data = await response.json();
          return { success: true, data };
        } catch (error) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
          throw error;
        } finally {
          span.end();
        }
      });
    },
  };
}