/**
 * FinOps Metrics Service (TAA §88)
 *
 * Tracks cloud costs and optimization:
 * - Resource tagging
 * - Cost budgets and forecasts
 * - Anomaly detection
 * - Cost per metric calculations
 */

export interface CostBudget {
  /** Budget ID */
  id: string;
  /** Budget name */
  name: string;
  /** Budget amount (USD) */
  amount: number;
  /** Budget period */
  period: 'daily' | 'monthly' | 'quarterly';
  /** Service/environment */
  service: string;
  /** Environment */
  environment: string;
  /** Alert threshold (percentage) */
  alertThreshold: number;
  /** Owner */
  owner: string;
}

export interface CostRecord {
  /** Record ID */
  id: string;
  /** Service */
  service: string;
  /** Environment */
  environment: string;
  /** Resource type */
  resourceType: string;
  /** Resource ID */
  resourceId: string;
  /** Cost amount (USD) */
  amount: number;
  /** Date */
  date: Date;
  /** Tags */
  tags: Record<string, string>;
}

export interface CostForecast {
  /** Service */
  service: string;
  /** Period */
  period: string;
  /** Forecasted amount (USD) */
  forecastedAmount: number;
  /** Actual amount so far (USD) */
  actualAmount: number;
  /** Budget amount (USD) */
  budgetAmount: number;
  /** Variance percentage */
  variancePercent: number;
}

export interface CostAnomaly {
  /** Anomaly ID */
  id: string;
  /** Service */
  service: string;
  /** Expected cost (USD) */
  expectedCost: number;
  /** Actual cost (USD) */
  actualCost: number;
  /** Variance percentage */
  variancePercent: number;
  /** Date */
  date: Date;
  /** Severity */
  severity: 'low' | 'medium' | 'high';
  /** Investigated */
  investigated: boolean;
}

export interface CostMetrics {
  /** Cost per MAU */
  costPerMAU: number;
  /** Cost per WEP */
  costPerWEP: number;
  /** Cost per viewing hour */
  costPerViewingHour: number;
  /** CDN cost per viewing hour */
  cdnCostPerViewingHour: number;
  /** Transcode cost per finished minute */
  transcodeCostPerMinute: number;
  /** Storage cost per content-hour */
  storageCostPerContentHour: number;
  /** Cost per 1,000 critical API requests */
  costPer1KAPIRequests: number;
}

export class FinOpsService {
  private readonly budgets: Map<string, CostBudget> = new Map();
  private readonly records: CostRecord[] = [];
  private readonly anomalies: CostAnomaly[] = [];

  /**
   * Add a cost budget
   */
  addBudget(budget: CostBudget): void {
    this.budgets.set(budget.id, budget);
  }

  /**
   * Record a cost
   */
  recordCost(record: Omit<CostRecord, 'id'>): CostRecord {
    const newRecord: CostRecord = {
      ...record,
      id: `cost_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    this.records.push(newRecord);

    // Check for anomalies
    this.checkForAnomaly(newRecord);

    return newRecord;
  }

  /**
   * Get cost forecast
   */
  getForecast(service: string, period: string): CostForecast | null {
    const budget = Array.from(this.budgets.values()).find(
      (b) => b.service === service && b.period === 'monthly'
    );

    if (!budget) return null;

    const serviceRecords = this.records.filter((r) => r.service === service);
    const totalCost = serviceRecords.reduce((sum, r) => sum + r.amount, 0);

    const daysInMonth = 30;
    const daysPassed = new Date().getDate();
    const dailyRate = totalCost / daysPassed;
    const forecastedAmount = dailyRate * daysInMonth;

    return {
      service,
      period,
      forecastedAmount: Math.round(forecastedAmount * 100) / 100,
      actualAmount: Math.round(totalCost * 100) / 100,
      budgetAmount: budget.amount,
      variancePercent:
        Math.round(((forecastedAmount - budget.amount) / budget.amount) * 100 * 100) / 100,
    };
  }

  /**
   * Get cost metrics
   */
  getCostMetrics(): CostMetrics {
    const totalCost = this.records.reduce((sum, r) => sum + r.amount, 0);

    // These would be calculated from actual business metrics in production
    return {
      costPerMAU: Math.round((totalCost / 75000) * 100) / 100,
      costPerWEP: Math.round((totalCost / 50000) * 100) / 100,
      costPerViewingHour: Math.round((totalCost / 100000) * 100) / 100,
      cdnCostPerViewingHour: Math.round(((totalCost * 0.3) / 100000) * 100) / 100,
      transcodeCostPerMinute: Math.round(((totalCost * 0.1) / 50000) * 100) / 100,
      storageCostPerContentHour: Math.round(((totalCost * 0.2) / 10000) * 100) / 100,
      costPer1KAPIRequests: Math.round((totalCost / 10000000) * 1000 * 100) / 100,
    };
  }

  /**
   * Check for cost anomaly
   */
  private checkForAnomaly(record: CostRecord): void {
    const recentRecords = this.records.filter(
      (r) =>
        r.service === record.service && r.date >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    if (recentRecords.length < 3) return;

    const avgCost = recentRecords.reduce((sum, r) => sum + r.amount, 0) / recentRecords.length;
    const variance = ((record.amount - avgCost) / avgCost) * 100;

    if (Math.abs(variance) > 50) {
      const anomaly: CostAnomaly = {
        id: `anomaly_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        service: record.service,
        expectedCost: avgCost,
        actualCost: record.amount,
        variancePercent: Math.round(variance * 100) / 100,
        date: record.date,
        severity: Math.abs(variance) > 100 ? 'high' : 'medium',
        investigated: false,
      };

      this.anomalies.push(anomaly);
    }
  }

  /**
   * Get cost anomalies
   */
  getAnomalies(investigated?: boolean): CostAnomaly[] {
    if (investigated !== undefined) {
      return this.anomalies.filter((a) => a.investigated === investigated);
    }
    return this.anomalies;
  }

  /**
   * Get cost summary
   */
  getSummary(): {
    totalCost: number;
    costByService: Record<string, number>;
    costByEnvironment: Record<string, number>;
    anomaliesCount: number;
    budgets: CostBudget[];
  } {
    const costByService: Record<string, number> = {};
    const costByEnvironment: Record<string, number> = {};

    for (const record of this.records) {
      costByService[record.service] = (costByService[record.service] || 0) + record.amount;
      costByEnvironment[record.environment] =
        (costByEnvironment[record.environment] || 0) + record.amount;
    }

    return {
      totalCost: Math.round(this.records.reduce((sum, r) => sum + r.amount, 0) * 100) / 100,
      costByService,
      costByEnvironment,
      anomaliesCount: this.anomalies.filter((a) => !a.investigated).length,
      budgets: Array.from(this.budgets.values()),
    };
  }
}
