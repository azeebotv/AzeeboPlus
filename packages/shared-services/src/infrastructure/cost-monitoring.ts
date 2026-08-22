/**
 * AWS Cost Monitoring Configuration
 * INF-004: Configure AWS cost alerts and budgets
 */

export interface CostAlert {
  name: string;
  type: 'budget' | 'anomaly' | 'forecast';
  threshold: number;
  thresholdType: 'PERCENTAGE' | 'ABSOLUTE_VALUE';
  comparisonOperator: 'GREATER_THAN' | 'LESS_THAN';
  notification: {
    email: string[];
    sns?: string;
  };
}

export interface CostBudget {
  name: string;
  budgetType: 'COST' | 'USAGE';
  timeUnit: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  limit: number;
  unit: string;
}

export const COST_BUDGETS: CostBudget[] = [
  { name: 'monthly-infrastructure', budgetType: 'COST', timeUnit: 'MONTHLY', limit: 5000, unit: 'USD' },
  { name: 'monthly-compute', budgetType: 'COST', timeUnit: 'MONTHLY', limit: 3000, unit: 'USD' },
  { name: 'monthly-database', budgetType: 'COST', timeUnit: 'MONTHLY', limit: 2000, unit: 'USD' },
  { name: 'monthly-storage', budgetType: 'COST', timeUnit: 'MONTHLY', limit: 500, unit: 'USD' },
  { name: 'monthly-networking', budgetType: 'COST', timeUnit: 'MONTHLY', limit: 1000, unit: 'USD' },
];

export const COST_ALERTS: CostAlert[] = [
  {
    name: 'high-spend-warning',
    type: 'budget',
    threshold: 80,
    thresholdType: 'PERCENTAGE',
    comparisonOperator: 'GREATER_THAN',
    notification: { email: ['ops@azeeboplus.com'] },
  },
  {
    name: 'high-spend-critical',
    type: 'budget',
    threshold: 100,
    thresholdType: 'PERCENTAGE',
    comparisonOperator: 'GREATER_THAN',
    notification: { email: ['ops@azeeboplus.com', 'cto@azeeboplus.com'] },
  },
  {
    name: 'anomaly-detection',
    type: 'anomaly',
    threshold: 50,
    thresholdType: 'PERCENTAGE',
    comparisonOperator: 'GREATER_THAN',
    notification: { email: ['ops@azeeboplus.com'] },
  },
  {
    name: 'forecast-exceeded',
    type: 'forecast',
    threshold: 100,
    thresholdType: 'PERCENTAGE',
    comparisonOperator: 'GREATER_THAN',
    notification: { email: ['ops@azeeboplus.com', 'finance@azeeboplus.com'] },
  },
];

// Resource tagging for cost allocation
export const COST_ALLOCATION_TAGS = {
  required: ['Environment', 'Service', 'Team', 'CostCenter'],
  optional: ['Project', 'Component', 'ManagedBy'],
  values: {
    Environment: ['production', 'staging', 'development'],
    Team: ['platform', 'content', 'growth', 'data'],
    CostCenter: ['engineering', 'marketing', 'operations'],
  },
} as const;

// Cost optimization recommendations
export const COST_OPTIMIZATION_RULES = [
  { service: 'ECS', rule: 'Right-size CPU/memory based on 70th percentile utilization', savings: '20-40%' },
  { service: 'RDS', rule: 'Enable auto-scaling and use reserved instances for baseline', savings: '30-50%' },
  { service: 'ElastiCache', rule: 'Use reserved nodes for production caches', savings: '30-40%' },
  { service: 'S3', rule: 'Enable lifecycle policies to move old data to Glacier', savings: '40-70%' },
  { service: 'CloudFront', rule: 'Enable Origin Shield and optimize cache policies', savings: '15-25%' },
] as const;
