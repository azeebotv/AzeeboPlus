import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 1000 },
    { duration: '2m', target: 2000 },
    { duration: '5m', target: 5000 },
    { duration: '2m', target: 10000 },
    { duration: '5m', target: 10000 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3013';

export function setup() {
  const res = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    email: `loadtest_${Date.now()}@example.com`,
    password: 'LoadTest123!',
    displayName: 'Load Test User',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.status === 201 || res.status === 409) {
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
      email: `loadtest_${Date.now()}@example.com`,
      password: 'LoadTest123!',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (loginRes.status === 200) {
      const body = JSON.parse(loginRes.body);
      return { token: body.data?.token };
    }
  }
  return { token: null };
}

export default function (data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const scenarios = [
    () => testHomeFeed(headers),
    () => testContentSearch(headers),
    () => testTrending(headers),
    () => testUserProfile(headers),
    () => testWallet(data),
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();

  sleep(Math.random() * 3 + 1);
}

function testHomeFeed(headers) {
  const res = http.get(`${BASE_URL}/content/home-feed`, { headers });
  check(res, {
    'home feed status 200': (r) => r.status === 200,
    'home feed has data': (r) => r.json('data') !== undefined,
  });
  errorRate.add(res.status !== 200);
  responseTime.add(res.timings.duration);
}

function testContentSearch(headers) {
  const queries = ['action', 'comedy', 'drama', 'trending', 'popular'];
  const query = queries[Math.floor(Math.random() * queries.length)];
  const res = http.get(`${BASE_URL}/content/search?query=${query}`, { headers });
  check(res, {
    'search status 200': (r) => r.status === 200,
  });
  errorRate.add(res.status !== 200);
  responseTime.add(res.timings.duration);
}

function testTrending(headers) {
  const res = http.get(`${BASE_URL}/content/trending`, { headers });
  check(res, {
    'trending status 200': (r) => r.status === 200,
  });
  errorRate.add(res.status !== 200);
  responseTime.add(res.timings.duration);
}

function testUserProfile(headers) {
  const res = http.get(`${BASE_URL}/users/profile`, { headers });
  check(res, {
    'profile status 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  errorRate.add(r => r.status !== 200 && r.status !== 401);
  responseTime.add(res.timings.duration);
}

function testWallet(data) {
  if (!data.token) return;

  const res = http.get(`${BASE_URL}/wallet/balance`, { headers: {
    'Authorization': `Bearer ${data.token}`,
  }});
  check(res, {
    'wallet status 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  errorRate.add(r => r.status !== 200 && r.status !== 401);
  responseTime.add(res.timings.duration);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const { metrics } = data;
  return `
Load Test Summary
==================
Duration: ${(metrics.data_points?.values?.duration / 1000).toFixed(2)}s
Total Requests: ${metrics.http_reqs?.values?.count || 0}
Failed Requests: ${metrics.http_req_failed?.values?.passes || 0}

Response Times:
  - Mean: ${metrics.http_req_duration?.values?.avg?.toFixed(2) || 0}ms
  - P95: ${metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 0}ms
  - P99: ${metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) || 0}ms
  - Max: ${metrics.http_req_duration?.values?.max?.toFixed(2) || 0}ms

Error Rate: ${((metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%
  `;
}
