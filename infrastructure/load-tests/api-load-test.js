import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },    // Stay at 20 users
    { duration: '30s', target: 50 },   // Spike to 50 users
    { duration: '1m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
    errors: ['rate<0.1'],             // Custom error rate should be less than 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api.azeebo.com';

// Test data
const testUsers = [
  { email: 'test1@example.com', password: 'Password123!' },
  { email: 'test2@example.com', password: 'Password123!' },
  { email: 'test3@example.com', password: 'Password123!' },
];

let authToken = '';

export function setup() {
  // Login to get auth token
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: testUsers[0].email,
    password: testUsers[0].password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  const body = loginRes.json();
  authToken = body?.data?.accessToken || '';

  return { authToken };
}

export default function (data) {
  const token = data.authToken;

  // Test 1: Health check
  healthCheck();

  // Test 2: Get content list
  getContentList(token);

  // Test 3: Get wallet balance
  getWalletBalance(token);

  // Test 4: Search content
  searchContent(token);

  sleep(1);
}

function healthCheck() {
  const res = http.get(`${BASE_URL}/auth/health`);
  check(res, {
    'health check returns 200': (r) => r.status === 200,
    'health check response time < 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(res.status !== 200);
}

function getContentList(token) {
  const res = http.get(`${BASE_URL}/content?page=1&limit=10`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  check(res, {
    'content list returns 200': (r) => r.status === 200,
    'content list has data': (r) => {
      const body = r.json();
      return body?.data && Array.isArray(body.data);
    },
    'content list response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(res.status !== 200);
}

function getWalletBalance(token) {
  const res = http.get(`${BASE_URL}/wallet`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  check(res, {
    'wallet balance returns 200': (r) => r.status === 200,
    'wallet balance has balance': (r) => {
      const body = r.json();
      return body?.data?.balance !== undefined;
    },
    'wallet balance response time < 300ms': (r) => r.timings.duration < 300,
  });
  errorRate.add(res.status !== 200);
}

function searchContent(token) {
  const res = http.get(`${BASE_URL}/content/search?q=comedy`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  check(res, {
    'search returns 200': (r) => r.status === 200,
    'search response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(res.status !== 200);
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options;
  
  return `
${indent}█ EXECUTION SUMMARY
${indent}
${indent}  ✗ scenarios......................: ${data.metrics.iterations?.values.count || 0} iterations
${indent}  ✓ duration.......................: ${data.state.testRunDurationMs / 1000}s
${indent}  ✓ data_received..................: ${formatBytes(data.metrics.data_received?.values.count || 0)}
${indent}  ✓ data_sent......................: ${formatBytes(data.metrics.data_sent?.values.count || 0)}
${indent}  ✓ http_req_duration..............: avg=${data.metrics.http_req_duration?.values.avg?.toFixed(0) || 0}ms min=${data.metrics.http_req_duration?.values.min?.toFixed(0) || 0}ms med=${data.metrics.http_req_duration?.values.med?.toFixed(0) || 0}ms max=${data.metrics.http_req_duration?.values.max?.toFixed(0) || 0}ms p(90)=${data.metrics.http_req_duration?.values['p(90)']?.toFixed(0) || 0}ms p(95)=${data.metrics.http_req_duration?.values['p(95)']?.toFixed(0) || 0}ms
${indent}  ✓ http_req_failed................: ${((data.metrics.http_req_failed?.values.rate || 0) * 100).toFixed(2)}%
${indent}  ✓ iterations.....................: ${data.metrics.iterations?.values.count || 0}
${indent}  ✓ vus............................: ${data.metrics.vus?.values.value || 0}
${indent}  ✓ vus_max........................: ${data.metrics.vus_max?.values.value || 0}
${indent}
${indent}  ✗ errors.........................: ${((data.metrics.errors?.values.rate || 0) * 100).toFixed(2)}%
  `;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
