// One-shot transition test: open N idle pgbouncer clients to cross the 80%
// degraded band, probe Ops Health, check the alerts feed, recover, re-probe.
import { createRequire } from 'node:module';
const require = createRequire('/Users/deprof/www/azeebo+/apps/admin/package.json');
const { Client } = require('pg');

const BASE = 'http://localhost:4100/api/v1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. login
const loginRes = await fetch(`${BASE}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@azeeboplus.com', password: 'Demo123!' }),
});
const login = await loginRes.json();
const TOKEN = login?.data?.access_token;
if (!TOKEN) throw new Error('login failed: ' + JSON.stringify(login).slice(0, 200));
const H = { Authorization: `Bearer ${TOKEN}` };

const probe = async () => {
  const r = await fetch(`${BASE}/admin/ops/pgbouncer`, { headers: H });
  const j = await r.json();
  const d = j?.data ?? {};
  return { level: d.level, clients: d.totalClients, max: d.maxClientConn };
};
const statusAlerts = async () => {
  const r = await fetch(`${BASE}/admin/ops/status`, { headers: H });
  const j = await r.json();
  const alerts = j?.data?.alerts ?? [];
  return alerts.filter((a) => a.source === 'pgbouncer');
};

console.log('--- baseline probe ---');
console.log(await probe());

// 2. open enough idle clients to cross the 80% band (ceiling 200 → need >160)
const EXTRA = 110;
const clients = [];
for (let i = 0; i < EXTRA; i++) {
  try {
    const c = new Client({
      host: '127.0.0.1',
      port: 6432,
      user: 'azeebo',
      password: 'azeebo_dev_pw',
      database: 'azeebo_admin',
    });
    await c.connect();
    clients.push(c);
  } catch (e) {
    console.log(`client ${i} failed: ${e.message}`);
    break;
  }
}
console.log(`opened ${clients.length} extra clients`);
await sleep(500);

console.log('--- probe under load (expect degraded) ---');
const loaded = await probe();
console.log(loaded);

console.log('--- alerts feed after degradation ---');
const degradedAlerts = await statusAlerts();
console.log(JSON.stringify(degradedAlerts, null, 2));

// 3. recover
for (const c of clients) await c.end().catch(() => undefined);
await sleep(1500);
console.log('--- probe after recovery (expect ok) ---');
console.log(await probe());
console.log('--- alerts feed after recovery (should be unchanged) ---');
console.log(JSON.stringify(await statusAlerts(), null, 2));
