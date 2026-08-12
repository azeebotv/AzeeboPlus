#!/usr/bin/env node
/**
 * Flutterwave mock — dockerized stub for the payment failover e2e.
 *
 * Defaults to provider-UP (HTTP 200 with the Flutterwave v3 /payments success
 * shape). Status is controllable at runtime:
 *
 *   POST /__control/status  {"status": 200} | {"status": 503}   flip behavior
 *   GET  /__control/status                      current mode
 *   GET  /__control/requests                    request log (method, url, body)
 *   POST /__control/reset                       clear log, back to 200
 *
 * Port: FLUTTERWAVE_MOCK_PORT (default 8092). Host port in
 * docker-compose.test.yml maps 8092:8092; the payment e2e points
 * FLUTTERWAVE_API_URL at it.
 */
const http = require('node:http');

const PORT = parseInt(process.env.FLUTTERWAVE_MOCK_PORT || '8092', 10);

let mode = 'up'; // 'down' (503) | 'up' (200)
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
      mode = 'up';
      return send(res, 200, { mode, reset: true });
    }

    // ---- provider plane: Flutterwave v3 payments/verify ----
    logRequest(req, body);

    if (mode === 'down') {
      return send(res, 503, {
        status: 'error',
        message: 'Flutterwave service temporarily unavailable (mock)',
      });
    }

    if (url.pathname === '/payments' && req.method === 'POST') {
      refCounter += 1;
      const reference = `fw-ref-${refCounter}`;
      return send(res, 200, {
        status: 'success',
        message: 'Charge initiated',
        data: {
          id: refCounter,
          tx_ref: `tx_${refCounter}`,
          reference,
          link: `http://localhost:${PORT}/pay/${reference}`,
        },
      });
    }

    if (url.pathname.startsWith('/transactions/') && req.method === 'GET') {
      const reference = url.pathname.split('/').slice(-2)[0];
      return send(res, 200, {
        status: 'success',
        message: 'Transaction fetched successfully',
        data: {
          id: refCounter,
          tx_ref: reference,
          status: 'successful',
          amount: 1000,
          currency: 'NGN',
          created_at: new Date().toISOString(),
        },
      });
    }

    return send(res, 404, { status: 'error', message: `Unhandled path ${url.pathname}` });
  });
});

server.listen(PORT, () => {
  console.log(`[flutterwave-mock] listening on :${PORT} (mode=${mode})`);
});
