import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3013';

export const options = {
  scenarios: {
    // Gradual ramp-up stress test
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },   // Ramp to 100 users
        { duration: '5m', target: 100 },   // Stay at 100
        { duration: '2m', target: 200 },   // Ramp to 200
        { duration: '5m', target: 200 },   // Stay at 200
        { duration: '2m', target: 300 },   // Ramp to 300
        { duration: '5m', target: 300 },   // Stay at 300
        { duration: '2m', target: 500 },   // Ramp to 500
        { duration: '5m', target: 500 },   // Stay at 500
        { duration: '2m', target: 0 },     // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // 95% under 1s
    http_req_failed: ['rate<0.15'],     // Less than 15% errors
    errors: ['rate<0.15'],
  },
};

const headers = { 'Content-Type': 'application/json' };

export default function () {
  // Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
  });

  // Auth endpoints
  const loginRes = http.post(
    `${BASE_URL}/v1/auth/login`,
    JSON.stringify({
      email: `stressuser${__VU}@example.com`,
      password: 'password123',
    }),
    { headers }
  );

  check(loginRes, {
    'login status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(loginRes.status >= 500);

  // Content endpoints
  const trendingRes = http.get(`${BASE_URL}/v1/content/trending?limit=10`, { headers });
  check(trendingRes, {
    'trending status 200': (r) => r.status === 200,
  });

  const searchRes = http.get(`${BASE_URL}/v1/search?q=nollywood&limit=10`, { headers });
  check(searchRes, {
    'search status 200': (r) => r.status === 200,
  });

  sleep(1);
}
