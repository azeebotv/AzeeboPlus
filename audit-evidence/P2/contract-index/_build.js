#!/usr/bin/env node
// Build a proper JSON contract index from every NestJS controller.
// Read-only; runs without pnpm install.
const fs = require('fs');
const path = require('path');

const SERVICES = [
  'services/core/auth-service',
  'services/core/content-service',
  'services/core/media-service',
  'services/core/payment-service',
  'services/core/search-service',
  'services/core/user-service',
  'services/core/wallet-service',
  'services/gateway/api-gateway',
  'services/engagement/engagement-service',
  'services/engagement/messaging-service',
  'services/engagement/notification-service',
  'services/engagement/referral-service',
  'services/engagement/reward-service',
  'services/engagement/subscription-service',
  'services/intelligence/analytics-service',
  'services/intelligence/recommendation-service',
  'services/operations/moderation-service',
  'services/operations/queue-service',
  'services/operations/support-service',
  'services/universes/comedy-service',
  'services/universes/creator-service',
  'services/universes/games-service',
  'services/universes/lifestyle-service',
  'services/universes/movie-service',
  'services/universes/reality-service',
  'services/universes/sports-service',
  'services/universes/vertical-service',
  'apps/admin',
  'apps/creator-portal',
];

const OUT_DIR = path.join(__dirname, 'controllers-by-service');
const INDEX_PATH = path.join(__dirname, 'contract-index.json');

// Read every controller, strip line comments + block comments, extract decorators.
function parseController(file) {
  const text = fs.readFileSync(file, 'utf8');
  // strip // comments + /* */ comments
  const stripped = text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  const lines = stripped.split('\n');
  const routes = [];
  let ctrlPath = '';
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    // @Controller('foo')
    const ctrlMatch = ln.match(/@Controller\(\s*['"]([^'"]+)['"]\s*\)/);
    if (ctrlMatch) {
      ctrlPath = ctrlMatch[1];
    }
    // @Get/@Post/.../('@Get(':line)
    const methodMatch = ln.match(/@(Get|Post|Put|Patch|Delete|Options|Head)\(\s*(['"]([^'"]+)['"])?\s*\)/);
    if (methodMatch) {
      const method = methodMatch[1];
      const subPath = methodMatch[3] || '';
      // look ahead for @UseGuards / @Public / @Throttle in next ~6 lines
      const guards = [];
      let publicFlag = false;
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const l = lines[j];
        const g = l.match(/@UseGuards\(\s*([^)]+)\)/);
        if (g) guards.push(g[1].trim());
        if (/@Public\(\s*\)/.test(l)) publicFlag = true;
        const t = l.match(/@Throttle\(\s*([^)]+)\)/);
        if (t) guards.push('Throttle(' + t[1].trim() + ')');
        // stop if we hit a function declaration
        if (/^\s*(async\s+)?[a-zA-Z_]\w*\s*\(/.test(l) && !l.includes('@')) break;
      }
      routes.push({
        file: path.relative(process.cwd(), file),
        ctrl_path: ctrlPath,
        method,
        sub_path: subPath,
        full_path: ctrlPath + (subPath ? (ctrlPath.endsWith('/') || subPath.startsWith('/') ? '' : '/') + subPath : ''),
        guards: guards.join('; ') || '(none)',
        public: publicFlag,
      });
    }
    i++;
  }
  return routes;
}

const index = {
  contract_index_version: '1.0',
  captured_at: new Date().toISOString(),
  commit: 'fc01c8c (dirty tree)',
  services: {},
};

for (const svc of SERVICES) {
  const routes = [];
  if (!fs.existsSync(svc)) continue;
  const files = fs.readdirSync(svc, { withFileTypes: true, recursive: true })
    .filter(d => {
      if (!d.isFile()) return false;
      if (!d.name.endsWith('.controller.ts')) return false;
      const parent = d.parentPath || d.path || svc;
      if (parent.includes('/generated/')) return false;
      if (parent.includes('/node_modules/')) return false;
      return true;
    })
    .map(d => path.join(d.parentPath || d.path || svc, d.name));
  for (const f of files) {
    const parsed = parseController(f);
    routes.push(...parsed);
  }
  if (routes.length === 0) continue;
  index.services[svc] = {
    route_count: routes.length,
    routes,
  };
}

fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
const total = Object.values(index.services).reduce((s, v) => s + v.route_count, 0);
console.log(`wrote ${INDEX_PATH}: ${Object.keys(index.services).length} services, ${total} routes`);