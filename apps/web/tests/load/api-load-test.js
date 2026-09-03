import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const contentDuration = new Trend('content_duration');
const searchDuration = new Trend('search_duration');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3013';
const API_KEY = __ENV.API_KEY || '';

// Test scenarios
export const options = {
  scenarios: {
    // Smoke test
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      tags: { scenario: 'smoke' },
    },
    // Load test
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },  // Ramp up
        { duration: '5m', target: 50 },  // Stay at 50 VUs
        { duration: '2m', target: 100 }, // Ramp up to 100
        { duration: '5m', target: 100 }, // Stay at 100 VUs
        { duration: '2m', target: 0 },   // Ramp down
      ],
      tags: { scenario: 'load' },
    },
    // Stress test
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },  // Ramp up
        { duration: '5m', target: 100 },  // Stay at 100 VUs
        { duration: '2m', target: 200 },  // Spike to 200
        { duration: '3m', target: 200 },  // Stay at 200 VUs
        { duration: '2m', target: 0 },    // Ramp down
      ],
      tags: { scenario: 'stress' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],     // Less than 10% errors
    errors: ['rate<0.1'],
  },
};

// Headers
const headers = {
  'Content-Type': 'application/json',
  ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
};

// Helper function
function makeRequest(method, url, body = null) {
  const params = { headers };
  const response = body
    ? http.request(method, url, JSON.stringify(body), params)
    : http.request(method, url, null, params);

  check(response, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(response.status >= 400);
  return response;
}

// Main test function
export default function () {
  const scenario = __SCENARIO || 'smoke';

  // Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });

  // Test auth endpoints
  if (scenario === 'smoke' || scenario === 'load') {
    const loginStart = Date.now();
    const loginRes = makeRequest('POST', `${BASE_URL}/v1/auth/login`, {
      email: `testuser${__VU}@example.com`,
      password: 'password123',
    });
    loginDuration.add(Date.now() - loginStart);

    if (loginRes.status === 200) {
      const token = JSON.parse(loginRes.body).access_token;

      // Test content endpoints with auth
      const contentStart = Date.now();
      makeRequest('GET', `${BASE_URL}/v1/content/trending?limit=10`);
      contentDuration.add(Date.now() - contentStart);

      // Test search
      const searchStart = Date.now();
      makeRequest('GET', `${BASE_URL}/v1/search?q=nollywood&limit=10`);
      searchDuration.add(Date.now() - searchStart);

      // Test wallet
      makeRequest('GET', `${BASE_URL}/v1/wallet`, null, {
        headers: { ...headers, Authorization: `Bearer ${token}` },
      });
    }
  }

  sleep(1);
}

// Summary handler
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const lines = [];
  lines.push('=== k6 Load Test Summary ===');
  lines.push(`Total Requests: ${data.metrics.http_reqs?.values?.count || 0}`);
  lines.push(`Failed Requests: ${data.metrics.http_req_failed?.values?.rate || 0}`);
  lines.push(`Avg Response Time: ${data.metrics.http_req_duration?.values?.avg?.toFixed(2) || 0}ms`);
  lines.push(`P95 Response Time: ${data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 0}ms`);
  lines.push(`P99 Response Time: ${data.metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) || 0}ms`);
  lines.push(`Error Rate: ${(data.metrics.errors?.values?.rate * 100 || 0).toFixed(2)}%`);
  return lines.join('\n');
}
