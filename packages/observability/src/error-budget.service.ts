import { Injectable, Logger } from '@nestjs/common';

export interface ErrorBudgetConfig {
  sliName: string;
  targetPercent: number;
  windowDays: number;
  description: string;
}

export interface ErrorBudgetState {
  sliName: string;
  targetPercent: number;
  windowDays: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  actualPercent: number;
  budgetRemaining: number;
  budgetConsumed: number;
  status: 'healthy' | 'warning' | 'critical' | 'exhausted';
  lastUpdated: Date;
}

export interface SLIMeasurement {
  sliName: string;
  timestamp: Date;
  total: number;
  success: number;
  failed: number;
}

@Injectable()
export class ErrorBudgetService {
  private readonly logger = new Logger('ErrorBudget');
  private readonly configs: Map<string, ErrorBudgetConfig> = new Map();
  private readonly measurements: Map<string, SLIMeasurement[]> = new Map();

  constructor() {
    this.initializeDefaultBudgets();
  }

  private initializeDefaultBudgets(): void {
    const defaultBudgets: ErrorBudgetConfig[] = [
      {
        sliName: 'api_availability',
        targetPercent: 99.9,
        windowDays: 30,
        description: 'API availability SLI',
      },
      {
        sliName: 'api_latency',
        targetPercent: 99.0,
        windowDays: 30,
        description: 'API latency SLI (p95 < 500ms)',
      },
      {
        sliName: 'payment_success',
        targetPercent: 99.95,
        windowDays: 30,
        description: 'Payment success rate SLI',
      },
      {
        sliName: 'auth_success',
        targetPercent: 99.9,
        windowDays: 30,
        description: 'Authentication success rate SLI',
      },
      {
        sliName: 'search_availability',
        targetPercent: 99.5,
        windowDays: 30,
        description: 'Search service availability SLI',
      },
    ];

    defaultBudgets.forEach((config) => this.addBudget(config));
  }

  addBudget(config: ErrorBudgetConfig): void {
    this.configs.set(config.sliName, config);
    this.measurements.set(config.sliName, []);
    this.logger.log(`Added error budget: ${config.sliName} (${config.targetPercent}%)`);
  }

  removeBudget(sliName: string): void {
    this.configs.delete(sliName);
    this.measurements.delete(sliName);
    this.logger.log(`Removed error budget: ${sliName}`);
  }

  recordMeasurement(measurement: SLIMeasurement): void {
    const history = this.measurements.get(measurement.sliName) || [];
    history.push(measurement);

    const windowMs = this.getWindowMs(measurement.sliName);
    const cutoff = Date.now() - windowMs;
    const filteredHistory = history.filter((m) => m.timestamp.getTime() > cutoff);
    this.measurements.set(measurement.sliName, filteredHistory);

    const state = this.getBudgetState(measurement.sliName);
    if (state) {
      this.logBudgetState(state);
    }
  }

  getBudgetState(sliName: string): ErrorBudgetState | null {
    const config = this.configs.get(sliName);
    if (!config) {
      return null;
    }

    const history = this.measurements.get(sliName) || [];
    const totalRequests = history.reduce((sum, m) => sum + m.total, 0);
    const successfulRequests = history.reduce((sum, m) => sum + m.success, 0);
    const failedRequests = history.reduce((sum, m) => sum + m.failed, 0);

    const actualPercent = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
    const budgetRemaining = Math.max(0, actualPercent - (100 - config.targetPercent));
    const budgetConsumed = 100 - budgetRemaining;

    let status: ErrorBudgetState['status'];
    if (budgetRemaining <= 0) {
      status = 'exhausted';
    } else if (budgetRemaining < 20) {
      status = 'critical';
    } else if (budgetRemaining < 50) {
      status = 'warning';
    } else {
      status = 'healthy';
    }

    return {
      sliName,
      targetPercent: config.targetPercent,
      windowDays: config.windowDays,
      totalRequests,
      successfulRequests,
      failedRequests,
      actualPercent,
      budgetRemaining,
      budgetConsumed,
      status,
      lastUpdated: new Date(),
    };
  }

  getAllBudgetStates(): ErrorBudgetState[] {
    const states: ErrorBudgetState[] = [];
    for (const sliName of this.configs.keys()) {
      const state = this.getBudgetState(sliName);
      if (state) {
        states.push(state);
      }
    }
    return states;
  }

  getBudgetSummary(): {
    totalBudgets: number;
    healthy: number;
    warning: number;
    critical: number;
    exhausted: number;
  } {
    const states = this.getAllBudgetStates();
    return {
      totalBudgets: states.length,
      healthy: states.filter((s) => s.status === 'healthy').length,
      warning: states.filter((s) => s.status === 'warning').length,
      critical: states.filter((s) => s.status === 'critical').length,
      exhausted: states.filter((s) => s.status === 'exhausted').length,
    };
  }

  private getWindowMs(sliName: string): number {
    const config = this.configs.get(sliName);
    return config ? config.windowDays * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  }

  private logBudgetState(state: ErrorBudgetState): void {
    const emoji = {
      healthy: '✅',
      warning: '⚠️',
      critical: '🔴',
      exhausted: '💀',
    }[state.status];

    this.logger.log(
      `${emoji} Budget: ${state.sliName} - ${state.actualPercent.toFixed(2)}% (target: ${state.targetPercent}%) - ${state.budgetRemaining.toFixed(2)}% remaining [${state.status.toUpperCase()}]`
    );
  }
}
