import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const requestDuration = new Trend('req_duration', true);
const requestCount = new Counter('req_count');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3013';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Common headers
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Test configuration
export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Ramp up to 50 VUs
    { duration: '30s', target: 50 },  // Sustain 50 VUs
    { duration: '10s', target: 0 },   // Ramp down to 0 VUs
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
    errors: ['rate<0.1'],
  },
};

// Helper function to make authenticated requests
function getAuthHeaders() {
  if (!AUTH_TOKEN) return headers;
  return {
    ...headers,
    'Authorization': `Bearer ${AUTH_TOKEN}`,
  };
}

// Main test function
export default function () {
  const scenarios = [
    // 1. Health check (auth service)
    {
      name: 'auth_health',
      url: `${BASE_URL}/api/v1/auth/health`,
      method: 'GET',
      tags: { endpoint: '/api/v1/auth/health', service: 'auth' },
    },
    // 2. Content universes (content service)
    {
      name: 'content_universes',
      url: `${BASE_URL}/api/v1/content/universes`,
      method: 'GET',
      tags: { endpoint: '/api/v1/content/universes', service: 'content' },
    },
    // 3. Reality shows (reality service)
    {
      name: 'reality_shows',
      url: `${BASE_URL}/api/v1/reality/shows`,
      method: 'GET',
      tags: { endpoint: '/api/v1/reality/shows', service: 'reality' },
    },
    // 4. Wallet (authenticated)
    {
      name: 'wallet',
      url: `${BASE_URL}/api/v1/wallet`,
      method: 'GET',
      tags: { endpoint: '/api/v1/wallet', service: 'wallet' },
      requiresAuth: true,
    },
    // 5. Search
    {
      name: 'search',
      url: `${BASE_URL}/api/v1/search?q=test`,
      method: 'GET',
      tags: { endpoint: '/api/v1/search', service: 'search' },
    },
  ];

  // Execute each scenario
  for (const scenario of scenarios) {
    const reqHeaders = scenario.requiresAuth ? getAuthHeaders() : headers;

    const response = http.get(scenario.url, {
      headers: reqHeaders,
      tags: scenario.tags,
      timeout: '10s',
    });

    // Track metrics
    requestDuration.add(response.timings.duration);
    requestCount.add(1);

    // Check response
    const checks = check(response, {
      [`${scenario.name} - status is 200`]: (r) => r.status === 200,
      [`${scenario.name} - response time < 500ms`]: (r) => r.timings.duration < 500,
      [`${scenario.name} - has valid JSON`]: (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
    });

    // Track errors
    if (!checks) {
      errorRate.add(1);
      console.error(`${scenario.name} failed: status=${response.status}, duration=${response.timings.duration}ms`);
    } else {
      errorRate.add(0);
    }

    // Brief pause between requests
    sleep(0.1);
  }
}

// Handle summary
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalRequests: data.metrics.http_reqs?.values?.count || 0,
    failedRequests: data.metrics.http_req_failed?.values?.rate || 0,
    avgResponseTime: data.metrics.http_req_duration?.values?.avg || 0,
    p95ResponseTime: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
    p99ResponseTime: data.metrics.http_req_duration?.values?.['p(99)'] || 0,
    thresholdsPassed: Object.values(data.thresholds).every(t => t.ok),
  };

  console.log('\n=== Load Test Summary ===');
  console.log(JSON.stringify(summary, null, 2));

  // Return empty object to prevent default output
  return {};
}
