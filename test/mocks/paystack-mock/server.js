#!/usr/bin/env node
/**
 * Paystack mock — dockerized stub for the payment failover e2e.
 *
 * Defaults to provider-DOWN (HTTP 503 on every /transaction/* call) so the
 * e2e exercises the real fallback path. The status is controllable at runtime
 * so one test run can simulate "down" then "recovered":
 *
 *   POST /__control/status  {"status": 200} | {"status": 503}   flip behavior
 *   GET  /__control/status                      current mode
 *   GET  /__control/requests                    request log (method, url, body)
 *   POST /__control/reset                       clear log, back to 503
 *
 * Port: PAYSTACK_MOCK_PORT (default 8091). Host port in docker-compose.test.yml
 * maps 8091:8091; the payment e2e points PAYSTACK_API_URL at it.
 */
const http = require('node:http');

const PORT = parseInt(process.env.PAYSTACK_MOCK_PORT || '8091', 10);

let mode = 'down'; // 'down' (503) | 'up' (200)
const requests = [];
let refCounter = 0;

function logRequest(req, body) {
  requests.push({
    method: req.method,
    url: req.url,
    body: body ? JSON.parse(body) : null,
    at: new Date().toISOString(),
  });
}

function send(res, status, payload) {
  const json = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(json);
}

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // ---- control plane ----
    if (url.pathname === '/__control/status' && req.method === 'POST') {
      const next = JSON.parse(body || '{}').status;
      if (next !== 200 && next !== 503) return send(res, 400, { error: 'status must be 200|503' });
      mode = next === 200 ? 'up' : 'down';
      return send(res, 200, { mode });
    }
    if (url.pathname === '/__control/status' && req.method === 'GET') {
      return send(res, 200, { mode });
    }
    if (url.pathname === '/__control/requests' && req.method === 'GET') {
      return send(res, 200, { count: requests.length, requests });
    }
    if (url.pathname === '/__control/reset' && req.method === 'POST') {
      requests.length = 0;
      mode = 'down';
      return send(res, 200, { mode, reset: true });
    }

    // ---- provider plane: Paystack initialize/verify ----
    logRequest(req, body);

    if (mode === 'down') {
      return send(res, 503, {
        status: false,
        message: 'Paystack service temporarily unavailable (mock)',
      });
    }

    if (url.pathname === '/transaction/initialize' && req.method === 'POST') {
      refCounter += 1;
      const reference = `ps-ref-${refCounter}`;
      return send(res, 200, {
        status: true,
        message: 'Authorization URL created',
        data: {
          authorization_url: `http://localhost:${PORT}/pay/${reference}`,
          access_code: `ps-ac-${refCounter}`,
          reference,
        },
      });
    }

    if (url.pathname.startsWith('/transaction/verify/') && req.method === 'GET') {
      const reference = url.pathname.split('/').pop();
      return send(res, 200, {
        status: true,
        message: 'Verification successful',
        data: {
          status: 'success',
          reference,
          amount: 100000,
          currency: 'NGN',
          paid_at: new Date().toISOString(),
          customer: { id: 1, first_name: 'Test', last_name: 'User', email: 'test@azeebo.plus' },
        },
      });
    }

    return send(res, 404, { status: false, message: `Unhandled path ${url.pathname}` });
  });
});

server.listen(PORT, () => {
  console.log(`[paystack-mock] listening on :${PORT} (mode=${mode})`);
});
