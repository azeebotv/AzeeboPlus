#!/usr/bin/env node
const j = require('./contract-index.json');
console.log('services:', Object.keys(j.services).length);
console.log('total routes:', Object.values(j.services).reduce((s,v)=>s+v.route_count,0));
const allRoutes = Object.values(j.services).flatMap(s => s.routes);
console.log('routes with @Public():', allRoutes.filter(r => r.public).length);
console.log('routes with NO @UseGuards:', allRoutes.filter(r => r.guards === '(none)').length);

const unguardedBySvc = {};
for (const [svc, data] of Object.entries(j.services)) {
  for (const r of data.routes) {
    if (r.guards === '(none)' && !r.public) {
      unguardedBySvc[svc] = (unguardedBySvc[svc] || 0) + 1;
    }
  }
}
console.log('unguarded routes per service (top 10):');
const sorted = Object.entries(unguardedBySvc).sort((a,b)=>b[1]-a[1]);
for (const [s, c] of sorted.slice(0, 15)) {
  console.log('  ' + String(c).padStart(3) + '  ' + s);
}
console.log('total unguarded routes:', Object.values(unguardedBySvc).reduce((a,b)=>a+b,0));