/**
 * Dashboard Configuration
 * OBS-003: Create dashboards for key metrics
 */

export interface DashboardPanel {
  title: string;
  type: 'stat' | 'graph' | 'table' | 'heatmap';
  query: string;
  unit?: string;
}

export interface Dashboard {
  id: string;
  title: string;
  panels: DashboardPanel[];
}

export const DASHBOARDS: Record<string, Dashboard> = {
  'api-overview': {
    id: 'api-overview',
    title: 'API Overview',
    panels: [
      {
        title: 'Request Rate',
        type: 'graph',
        query: 'sum(rate(http_requests_total[5m]))',
        unit: 'req/s',
      },
      {
        title: 'Error Rate',
        type: 'stat',
        query:
          'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))',
        unit: '%',
      },
      {
        title: 'P95 Latency',
        type: 'stat',
        query:
          'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))',
        unit: 's',
      },
      {
        title: 'Active Connections',
        type: 'stat',
        query: 'sum(http_connections_active)',
        unit: '',
      },
    ],
  },
  database: {
    id: 'database',
    title: 'Database Performance',
    panels: [
      { title: 'Active Connections', type: 'stat', query: 'pg_stat_activity_count', unit: '' },
      {
        title: 'Query Duration P95',
        type: 'graph',
        query: 'pg_stat_activity_max_tx_duration',
        unit: 's',
      },
      {
        title: 'Cache Hit Ratio',
        type: 'stat',
        query:
          'pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read)',
        unit: '%',
      },
    ],
  },
  business: {
    id: 'business',
    title: 'Business Metrics',
    panels: [
      { title: 'Signups Today', type: 'stat', query: 'sum(increase(signups_total[1d]))', unit: '' },
      {
        title: 'Revenue Today',
        type: 'stat',
        query: 'sum(increase(revenue_total[1d]))',
        unit: 'NGN',
      },
      { title: 'Active Users', type: 'stat', query: 'count(active_users)', unit: '' },
    ],
  },
};
