#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const WEB_API = 'apps/web/src/lib/api.ts';
const MOBILE_API_DIR = 'apps/mobile/src/api';

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function extractUrls(text) {
  const urls = new Set();
  const re = /['"`](https?:\/\/[^'"`]+|\/(?:api|v1|v2|auth|wallet|users?|privacy|payments|admin|search|content|notifications)\/[^'"`]+|\/(?:auth|wallet|users?|privacy|payments|admin|search|content|notifications))['"`]/gi;
  let m;
  while ((m = re.exec(text))) urls.add(m[1]);
  return Array.from(urls);
}

function findNamespaceMethods(text, nsName) {
  const re = new RegExp('export\\s+const\\s+' + nsName + '\\s*=\\s*\\{([\\s\\S]*?)\\n\\};', 'm');
  const m = re.exec(text);
  if (!m) return [];
  const body = m[1];
  const methods = [];
  const chunks = body.split(/,\s*\n/);
  for (const ch of chunks) {
    const nameMatch = ch.match(/^\s*([a-zA-Z_]\w*)\s*:\s*async\s*\(/);
    if (nameMatch) {
      const name = nameMatch[1];
      const urls = extractUrls(ch);
      methods.push({ ns: nsName, name, urls, snippet: ch.trim().slice(0, 200) });
    }
  }
  return methods;
}

const out = {
  captured_at: new Date().toISOString(),
  commit: 'fc01c8c (dirty tree)',
  surfaces: {},
};

// Web api.ts: extract every URL string literal + adjacent method name via heuristic.
// Strategy: find every URL literal, then look 5 lines up for the enclosing method name.
if (fs.existsSync(WEB_API)) {
  const src = fs.readFileSync(WEB_API, 'utf8');
  const stripped = stripComments(src);
  const lines = stripped.split('\n');
  const urlRegex = /['"`](https?:\/\/[^'"`]+|\/(?:api|v1|v2|auth|wallet|users?|privacy|payments|admin|search|content|notifications)\/[^'"`]+|\/(?:auth|wallet|users?|privacy|payments|admin|search|content|notifications))['"`]/gi;
  const methods = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const m = urlRegex.exec(ln);
    if (!m) continue;
    const url = m[1];
    // find enclosing method by walking up
    let methodName = '';
    for (let j = i; j >= Math.max(0, i - 30); j--) {
      const l = lines[j];
      const nm = l.match(/^\s*(?:public\s+|private\s+|protected\s+)?(?:async\s+)?([a-zA-Z_]\w*)\s*(?:<[^>]*>)?\s*\(/);
      if (nm) { methodName = nm[1]; break; }
    }
    methods.push({ name: methodName, urls: [url], line: i + 1, snippet: ln.trim().slice(0, 160) });
  }
  // de-dupe by (name, url)
  const seen = new Set();
  const dedup = [];
  for (const m of methods) {
    const k = m.name + '\t' + m.urls.join(',');
    if (seen.has(k)) continue;
    seen.add(k);
    dedup.push(m);
  }
  out.surfaces['apps/web/src/lib/api.ts'] = {
    file: WEB_API,
    line_count: src.split('\n').length,
    methods: dedup,
  };
}

if (fs.existsSync(MOBILE_API_DIR)) {
  for (const f of fs.readdirSync(MOBILE_API_DIR)) {
    if (!f.endsWith('.ts') || f.endsWith('.spec.ts')) continue;
    const file = path.join(MOBILE_API_DIR, f);
    const src = fs.readFileSync(file, 'utf8');
    const stripped = stripComments(src);
    const nsMatches = [...stripped.matchAll(/export\s+const\s+([a-zA-Z_]\w*)\s*=\s*\{/g)].map(mm => mm[1]);
    const methods = [];
    for (const ns of nsMatches) {
      methods.push(...findNamespaceMethods(stripped, ns));
    }
    out.surfaces['mobile/' + f] = {
      file,
      line_count: src.split('\n').length,
      namespaces: nsMatches,
      methods,
    };
  }
}

fs.writeFileSync(__dirname + '/frontend-calls.json', JSON.stringify(out, null, 2));
let totalMethods = 0, totalUrls = 0;
const allUrls = new Set();
for (const k of Object.keys(out.surfaces)) {
  const s = out.surfaces[k];
  const list = s.methods || [];
  totalMethods += list.length;
  for (const m of list) {
    totalUrls += (m.urls || []).length;
    for (const u of (m.urls || [])) allUrls.add(u);
  }
}
console.log(`surfaces=${Object.keys(out.surfaces).length} methods=${totalMethods} urlMentions=${totalUrls} uniqueUrls=${allUrls.size}`);