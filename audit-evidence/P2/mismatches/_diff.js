#!/usr/bin/env node
const fs = require('fs');

const contract = require('../contract-index/contract-index.json');
const calls = require('../frontend-calls/frontend-calls.json');

// Build an index of backend routes keyed by all possible prefixes.
// For a route like "users/:id/avatar", the prefixes are:
//   "users", "users/:id", "users/:id/avatar"
// so a frontend URL "users/123" will prefix-match "users" via "users" but we
// also want to match by replacing :id with a wildcard.
function routePrefixes(fullPath) {
  const parts = (fullPath || '').split('/').filter(Boolean);
  const prefixes = [''];
  for (let i = 0; i < parts.length; i++) {
    prefixes.push(parts.slice(0, i + 1).join('/'));
  }
  return prefixes;
}

// For matching, build a map: prefixString -> [{route}]
const prefixMap = {};
for (const [svc, data] of Object.entries(contract.services)) {
  for (const r of data.routes) {
    const prefixes = routePrefixes(r.full_path);
    for (const p of prefixes) {
      const key = r.method.toUpperCase() + ' ' + p.toLowerCase();
      if (!prefixMap[key]) prefixMap[key] = [];
      prefixMap[key].push({ ...r, service: svc });
    }
  }
}

// Normalise a frontend URL: lowercase, strip trailing slash
function norm(p) {
  return (p || '').toLowerCase().replace(/\/$/, '');
}

// For each frontend call URL, find the longest prefix match.
const matches = [];
const unmatchedCalls = [];
const seenUrls = new Set();

for (const [surfaceName, surface] of Object.entries(calls.surfaces)) {
  for (const m of (surface.methods || [])) {
    for (const url of (m.urls || [])) {
      const normalised = norm(url);
      if (seenUrls.has(normalised)) continue;
      seenUrls.add(normalised);
      const parts = normalised.split('/').filter(Boolean);
      // try from longest prefix down to 1 segment
      let candidates = [];
      for (let len = parts.length; len >= 1; len--) {
        const prefix = parts.slice(0, len).join('/');
        for (const mth of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
          const k = mth + ' ' + prefix;
          if (prefixMap[k]) candidates.push(...prefixMap[k]);
        }
        if (candidates.length) break;
      }
      if (candidates.length === 0) {
        unmatchedCalls.push({ surface: surfaceName, frontend_method: m.name, url, line: m.line });
      } else {
        matches.push({
          surface: surfaceName,
          frontend_method: m.name,
          url,
          matched_prefix_length: candidates[0].full_path,
          candidates: candidates.map(c => ({ service: c.service, method: c.method, full_path: c.full_path, guards: c.guards, public: c.public })),
        });
      }
    }
  }
}

// Backend-only routes
const matchedSet = new Set();
for (const m of matches) for (const c of m.candidates) matchedSet.add(c.service + '\t' + c.method + '\t' + c.full_path);
const allBackend = [];
for (const [svc, data] of Object.entries(contract.services))
  for (const r of data.routes) allBackend.push({ service: svc, method: r.method, full_path: r.full_path });
const backendOnly = allBackend.filter(r => !matchedSet.has(r.service + '\t' + r.method + '\t' + r.full_path));

const out = {
  captured_at: new Date().toISOString(),
  total_backend_routes: allBackend.length,
  total_frontend_urls: seenUrls.size,
  matches: matches.length,
  unmatched_frontend_calls: unmatchedCalls.length,
  backend_only_routes: backendOnly.length,
  unmatched_calls_sample: unmatchedCalls.slice(0, 200),
  matches_sample: matches.slice(0, 30),
  backend_only_sample: backendOnly.slice(0, 200),
};

fs.writeFileSync(__dirname + '/contract-diff.json', JSON.stringify(out, null, 2));
console.log('backend_routes=' + allBackend.length);
console.log('frontend_urls=' + seenUrls.size);
console.log('matches=' + matches.length);
console.log('unmatched_frontend_calls=' + unmatchedCalls.length);
console.log('backend_only_routes=' + backendOnly.length);