export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  monitoringPeriod: number;
}
export const CIRCUIT_BREAKER_CONFIGS: Record<string, CircuitBreakerConfig> = {
  'auth-service': { failureThreshold: 5, successThreshold: 3, timeout: 30000, monitoringPeriod: 60000 },
  'payment-service': { failureThreshold: 3, successThreshold: 5, timeout: 60000, monitoringPeriod: 120000 },
  'wallet-service': { failureThreshold: 3, successThreshold: 5, timeout: 60000, monitoringPeriod: 120000 },
  'content-service': { failureThreshold: 5, successThreshold: 3, timeout: 30000, monitoringPeriod: 60000 },
  'search-service': { failureThreshold: 5, successThreshold: 3, timeout: 15000, monitoringPeriod: 30000 },
  'media-service': { failureThreshold: 5, successThreshold: 3, timeout: 30000, monitoringPeriod: 60000 },
  default: { failureThreshold: 5, successThreshold: 3, timeout: 30000, monitoringPeriod: 60000 },
};
export function getCircuitBreakerConfig(serviceName: string): CircuitBreakerConfig {
  return CIRCUIT_BREAKER_CONFIGS[serviceName] || CIRCUIT_BREAKER_CONFIGS.default;
}
