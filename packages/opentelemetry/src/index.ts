import { NodeSDK } from '@opentelemetry/sdk-node';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { context, SpanStatusCode, Span, trace, propagation, Context } from '@opentelemetry/api';

const LOG_PREFIX = '[OpenTelemetry]';

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
  otlpEndpoint:
    process.env.OTLP_ENDPOINT || 'http://otel-collector.azeebo-monitoring.svc.cluster.local:4318',
  environment: process.env.NODE_ENV || 'development',
  samplingRatio: 1.0,
};

/** Initializes the OpenTelemetry SDK with HTTP, Express, and Prisma instrumentations. */
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
    sampler: new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(finalConfig.samplingRatio!) }),
  });

  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation({
        requestHook: (span: Span, request: { path: string }) => {
          const pathOnly = request.path.split('?')[0];
          span.setAttribute('http.request.path', pathOnly);
        },
      } as never),
      new ExpressInstrumentation({
        requestHook: (span: Span, request: { path: string; method: string }) => {
          span.setAttribute('http.route', request.path);
          span.setAttribute('http.method', request.method);
        },
      } as never),
      new PrismaInstrumentation(),
    ],
  });

  const shutdown = async () => {
    try {
      await sdk.shutdown();
      process.stderr.write(`${LOG_PREFIX} SDK shut down gracefully\n`);
    } catch (error) {
      process.stderr.write(`${LOG_PREFIX} Error shutting down SDK: ${error}\n`);
    } finally {
      process.exit(0);
    }
  };

  // Use once() to avoid duplicate signal handlers if other packages also listen
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);

  sdk.start();
  process.stderr.write(`${LOG_PREFIX} Tracing initialized for ${finalConfig.serviceName}\n`);

  return sdk;
}

/** Creates an HTTP client wrapper that propagates OpenTelemetry trace context. */
export function createTracedHttpClient(baseUrl: string) {
  return {
    async request(method: string, path: string, options: RequestInit = {}) {
      const tracer = trace.getTracer('http-client');
      const activeContext: Context = context.active();

      return tracer.startActiveSpan(
        `HTTP ${method}`,
        { attributes: { 'http.url': `${baseUrl}${path}` } },
        activeContext,
        async (span: Span) => {
          try {
            const headers = new Headers(options.headers);
            propagation.inject(activeContext, Object.fromEntries(headers.entries()));

            const response = await fetch(`${baseUrl}${path}`, {
              method,
              ...options,
              headers,
            });
            span.setAttribute('http.status_code', response.status);
            if (!response.ok) {
              span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${response.status}` });
            }
            const contentType = response.headers.get('content-type');
            let data: unknown;
            if (contentType?.includes('application/json')) {
              data = await response.json();
            } else {
              data = await response.text();
            }
            return { success: true, data };
          } catch (error) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
            throw error;
          } finally {
            span.end();
          }
        }
      );
    },
  };
}
