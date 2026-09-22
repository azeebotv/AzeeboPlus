#!/usr/bin/env node
/**
 * Dev virus-scanner stub for the media-service upload pipeline.
 *
 * Implements the scanner contract expected at MEDIA_VIRUS_SCAN_URL:
 *   POST /scan  { key, mimetype }  →  200 { clean: boolean }
 *
 * Approves everything except payloads whose key references an EICAR-style
 * test marker, so the fail-closed rejection path stays testable locally.
 * This is a DEV TOOL — production must point MEDIA_VIRUS_SCAN_URL at a real
 * scanner (ClamAV, VirusTotal, etc.).
 *
 * Usage: PORT=8085 node scripts/dev-virus-scanner-stub.mjs
 */
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT || 8085);
/** Keys containing this marker are reported as infected. */
const INFECTED_MARKER = 'eicar-test';

const server = createServer((req, res) => {
  if (req.method !== 'POST' || !req.url.startsWith('/scan')) {
    res.writeHead(404).end();
    return;
  }
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    try {
      const { key } = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      const clean = !String(key || '').toLowerCase().includes(INFECTED_MARKER);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ clean, scanner: 'azeebo-dev-stub' }));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ clean: false, error: 'bad request' }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`[dev-virus-scanner-stub] listening on http://127.0.0.1:${PORT} (POST /scan)`);
});
