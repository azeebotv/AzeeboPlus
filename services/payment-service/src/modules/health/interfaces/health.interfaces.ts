export interface ComponentStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  message: string;
}

export interface ExternalService {
  name: string;
  url: string;
  timeout: number;
  status?: 'healthy' | 'unhealthy';
  latency?: number;
  message?: string;
}

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    database: ComponentStatus;
    memory: ComponentStatus;
    disk: ComponentStatus;
    external: ExternalService[];
  };
}