/**
 * Core of the seed-image-hosts check — parameterized by the repo `root` so it
 * can be unit-tested against fixture trees (see
 * scripts/__tests__/seed-image-hosts.test.mjs).
 *
 * The problem this prevents: seeder URLs land in the database and flow into
 * `next/image` render paths, and Next's image optimizer crashes at runtime on
 * any host missing from apps/web/next.config.js images.remotePatterns
 * (cdn.azeebo.test did exactly that). Three drift shapes exist:
 *
 *   1. A host registered in scripts/seeders/seed-image-hosts.ts but never
 *      allowlisted in the web config → every seeded record using it crashes
 *      the web app.  → HOST_NOT_ALLOWLISTED
 *   2. A seeder emitting a raw URL literal instead of routing through
 *      seedImageUrl()/seedImages — bypassing registration entirely, which is
 *      how cdn.azeebo.test got into the DB unnoticed.
 *      → HARDCODED_MEDIA_URL
 *   3. ANY seed-data source (TS seeders, demo-content SQL/CSV, database
 *      scripts) emitting a URL to a host the web allowlist doesn't cover —
 *      exact or wildcard — regardless of registration.
 *      → EMISSION_NOT_ALLOWLISTED
 *   4. An allowlist entry that is fully covered by another entry (literal
 *      duplicate, exact host under a wildcard, `*` shadowed by `**`) — the
 *      config stays minimal and every entry earns its place.
 *      → REDUNDANT_ALLOWLIST_ENTRY
 *
 * Social profile links (instagram.com, youtube.com) and link-shaped URLs
 * (/terms, /privacy, /live/ stream pages) are exempt: they are hyperlinks
 * rendered as <a>, never fetched by the image optimizer.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const MODULE_REL = 'scripts/seeders/seed-image-hosts.ts';
const WEB_CONFIG_REL = 'apps/web/next.config.js';

/** Hosts that appear in seeder sources as links (not media) and are exempt. */
const LINK_HOST_EXEMPTIONS = new Set([
  'instagram.com',
  'youtube.com',
  'www.youtube.com',
  // Slack webhook endpoints (admin-data-freshness notifications): outbound
  // HTTP POST targets, never image-optimizer input.
  'hooks.slack.com',
  // `partner_banks.applyUrl` in the wallet seed: where a viewer is sent to
  // submit a loan application, rendered as an <a>. The path is a bank slug
  // rather than a link-shaped word, so the path exemptions below cannot name
  // it, and allowlisting the host in `images.remotePatterns` would be worse —
  // that would hand the image optimizer a domain we only ever hyperlink to.
  'apply.example.org',
]);

/**
 * Path shapes that mark a URL as a LINK (page/stream/doc), not image-optimizer
 * input. Keep this list short and commented — a new media URL must NOT match
 * any of these, or it would slip past the allowlist diff.
 *   /terms, /privacy  → legal pages stored in system_settings
 *   /live/            → stream landing pages in demo screening rows
 */
const LINK_URL_EXEMPTIONS = [
  /\/terms(\b|\/?$)/,
  /\/privacy(\b|\/?$)/,
  /\/live\//,
  // XML DOCTYPE system identifiers (e.g. http://www.apple.com/DTDs/…dtd inside a
  // generated launchd plist) are markup boilerplate, not fetchable media or
  // navigable links — any host can appear there, so exempt the exact DTD shape
  // (a .jpg under /DTDs/ stays flagged).
  /^\/DTDs\/.+\.dtd$/,
];

/**
 * Next.js-remotePatterns hostname matching, modeled exactly:
 *   exact literal      → matches itself
 *   `*.suffix`         → exactly ONE extra label (a.suffix ✓, a.b.suffix ✗,
 *                        the apex suffix itself ✗)
 *   `**.suffix`        → one or more extra labels (a.b.suffix ✓)
 */
export function hostMatchesAllowlist(host, allowHosts) {
  return allowHosts.some((pattern) => {
    if (pattern === host) return true;
    if (pattern.startsWith('**.')) {
      const suffix = pattern.slice(3);
      return host.endsWith(`.${suffix}`);
    }
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      if (!host.endsWith(`.${suffix}`)) return false;
      return !host.slice(0, host.length - suffix.length - 1).includes('.');
    }
    return false;
  });
}

/** Extracts the `SEED_IMAGE_HOSTS` keys from the module source. */
export function extractSeedHosts(source) {
  const start = source.indexOf('SEED_IMAGE_HOSTS');
  if (start === -1) return { hosts: null, error: 'SEED_IMAGE_HOSTS not found in module' };
  const open = source.indexOf('{', start);
  if (open === -1) return { hosts: null, error: 'SEED_IMAGE_HOSTS object not found' };
  // Balanced-brace scan. Comments are stripped first: apostrophes/braces in
  // // or /* */ text would otherwise desync the string/brace state machine
  // (e.g. a "don't" in a host comment reads as an unterminated string).
  let depth = 0,
    inStr = null,
    inLineComment = false,
    inBlockComment = false;
  let close = -1;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];
    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inStr) {
      // allow escaped quotes inside strings
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inStr = ch;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }
  if (close === -1) return { hosts: null, error: 'SEED_IMAGE_HOSTS object never closes' };
  const body = source.slice(open, close + 1);
  const hosts = [];
  for (const m of body.matchAll(/'(https:\/\/)?([a-zA-Z0-9.-]+)':/g)) hosts.push(m[2]);
  return { hosts: [...new Set(hosts)], error: null };
}

/** Extracts every `hostname:` value inside the web config's remotePatterns array. */
export function extractAllowlistedHosts(configSource, { dedupe = true } = {}) {
  const start = configSource.indexOf('remotePatterns');
  if (start === -1) return { hosts: null, error: 'remotePatterns not found in web config' };
  const open = configSource.indexOf('[', start);
  if (open === -1) return { hosts: null, error: 'remotePatterns array not found' };
  let depth = 0,
    inStr = null;
  let close = -1;
  for (let i = open; i < configSource.length; i++) {
    const ch = configSource[i];
    if (inStr) {
      if (ch === inStr) inStr = null;
    } else if (ch === "'" || ch === '"') {
      inStr = ch;
    } else if (ch === '[') {
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }
  if (close === -1) return { hosts: null, error: 'remotePatterns array never closes' };
  const body = configSource.slice(open, close + 1);
  const hosts = [];
  for (const m of body.matchAll(/hostname:\s*['"]([^'"]+)['"]/g)) hosts.push(m[1]);
  // dedupe:false exposes literal duplicate entries — the minimality rule needs
  // to see them; the sync rules want the collapsed view.
  return { hosts: dedupe ? [...new Set(hosts)] : hosts, error: null };
}

/**
 * Pattern-level coverage for the minimality rule. Unlike hostMatchesAllowlist
 * (which matches CONCRETE hosts — feeding it a pattern string would wrongly
 * parse the pattern's own labels as a hostname), this answers: does pattern
 * `a` cover every host that pattern `b` could ever match?
 *
 * Coverage over all hosts:
 *   exact H       → { H }
 *   `*.S`         → { L.S : L is exactly one label }
 *   `**.S`        → { W.S : W is one or more labels }
 * so a wildcard NEVER covers its own apex, and `*.S` never covers two-label
 * hosts — which is what keeps e.g. `azeeboplus.com` + `*.azeeboplus.com` a
 * legal (non-redundant) pair.
 */
export function patternCoversPattern(pattern, other) {
  if (pattern === other) return true; // literal duplicate
  const parse = (p) => {
    if (p.startsWith('**.')) return { mode: '**', suffix: p.slice(3) };
    if (p.startsWith('*.')) return { mode: '*', suffix: p.slice(2) };
    return { mode: 'exact', suffix: p };
  };
  const a = parse(pattern);
  const b = parse(other);
  if (b.mode === 'exact') {
    // A wildcard covers an exact host only when that host sits strictly below
    // the wildcard's suffix (apex excluded).
    if (a.mode === 'exact') return false;
    if (!b.suffix.endsWith(`.${a.suffix}`)) return false;
    if (a.mode === '*') {
      const before = b.suffix.slice(0, b.suffix.length - a.suffix.length - 1);
      return !before.includes('.'); // exactly one label under the suffix
    }
    return true; // ** covers any depth under its suffix
  }
  // b is a wildcard: only a `**` pattern can be a superset of another
  // wildcard's coverage, and only when b's suffix sits at or below a's.
  if (a.mode !== '**') return false;
  return b.suffix === a.suffix || b.suffix.endsWith(`.${a.suffix}`);
}

/**
 * Minimality diff — no allowlist entry may be redundant with another entry
 * (wildcard or exact). Redundant entries widen the matcher surface without
 * adding coverage and obscure which entry actually authorizes a host.
 */
export function diffAllowlistRedundancy(configSource, { allowEntries = null } = {}) {
  const entries =
    allowEntries ??
    (() => {
      const r = extractAllowlistedHosts(configSource, { dedupe: false });
      return r.error ? [] : r.hosts;
    })();
  const problems = [];
  for (let i = 0; i < entries.length; i++) {
    // An entry is redundant when any other entry covers it — except that a
    // literal duplicate only flags its LATER instance (either could go; the
    // first stays, matching how a human would de-dupe by hand).
    const coveredBy = entries.find(
      (other, j) =>
        j !== i && (other !== entries[i] || j < i) && patternCoversPattern(other, entries[i])
    );
    if (coveredBy !== undefined) {
      problems.push({
        code: 'REDUNDANT_ALLOWLIST_ENTRY',
        file: WEB_CONFIG_REL,
        message:
          `allowlist entry "${entries[i]}" is fully covered by "${coveredBy}" — ` +
          'every host it matches is already authorized',
        fix: `delete the { hostname: '${entries[i]}' } entry from images.remotePatterns to keep the allowlist minimal`,
      });
    }
  }
  return problems;
}

/** Lists the seeder source files the bypass scan covers (no glob deps). */
export function collectSeederFiles(root) {
  const files = [];
  const seedersDir = path.join(root, 'scripts', 'seeders');
  if (existsSync(seedersDir)) {
    for (const entry of readdirSync(seedersDir)) {
      if (entry.endsWith('.ts')) files.push(path.join('scripts', 'seeders', entry));
    }
  }
  if (existsSync(path.join(root, 'scripts'))) {
    for (const entry of readdirSync(path.join(root, 'scripts'))) {
      if (/^seed-.*\.ts$/.test(entry)) files.push(path.join('scripts', entry));
    }
  }
  return files.sort();
}

/**
 * Lists the seed-data files the emission diff covers: every TEXT file under
 * scripts/demo-content and scripts/database, recursively. Loose files at the
 * scripts/ root are ops tooling (release scripts, drift bot, load tests), not
 * seed data; TS seeder files are rule 2's stricter domain (module routing) —
 * so neither is scanned here, and the same line is never double-flagged.
 */
export function collectEmissionFiles(root, dirRel = null, files = []) {
  const base = dirRel ? path.join(root, dirRel) : path.join(root, 'scripts');
  if (!existsSync(base)) return files;
  const TEXT_EXT = new Set(['.sql', '.csv', '.ts', '.mjs', '.js', '.py', '.sh', '.json']);
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    const rel = dirRel ? path.join(dirRel, entry.name) : path.join('scripts', entry.name);
    if (entry.isDirectory()) {
      if (dirRel || /^(demo-content|database)$/.test(entry.name)) {
        collectEmissionFiles(root, rel, files);
      }
    } else if (dirRel && TEXT_EXT.has(path.extname(entry.name))) {
      files.push(rel);
    }
  }
  return files;
}

/**
 * Rule 3 — the emission-level diff: every URL emitted by ANY seed-data source
 * (TS seeders, demo-content SQL/CSV, database scripts) must resolve against
 * the web allowlist, unless it is a registered seed host, a known link host,
 * or a link-shaped URL (/terms, /live/...). This catches hosts that bypass the
 * TS module entirely via raw SQL/demo data — the ui-avatars.com class.
 */
export function diffSeederEmissions(root, { seedHosts, allowHosts, emissionSources } = {}) {
  const problems = [];
  const sources =
    emissionSources ??
    Object.fromEntries(
      collectEmissionFiles(root)
        .filter((rel) => rel !== MODULE_REL)
        .map((rel) => [rel, readFileSync(path.join(root, rel), 'utf8')])
    );
  const URL_RE = /https?:\/\/([a-zA-Z0-9.-]+)(\/[^\s'"`,;()\[\]<>\\]*)?/g;
  for (const [rel, source] of Object.entries(sources)) {
    const lines = source.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const m of lines[i].matchAll(URL_RE)) {
        const host = m[1].toLowerCase();
        const urlPath = m[2] ?? '';
        if (seedHosts.includes(host)) continue; // registered — rule 1 proved the allowlist
        if (LINK_HOST_EXEMPTIONS.has(host)) continue;
        if (LINK_URL_EXEMPTIONS.some((rx) => rx.test(urlPath))) continue;
        if (hostMatchesAllowlist(host, allowHosts)) continue;
        problems.push({
          code: 'EMISSION_NOT_ALLOWLISTED',
          file: rel,
          line: i + 1,
          message: `seed data emits "${host}" which is not allowlisted in apps/web/next.config.js images.remotePatterns (no exact or wildcard match)`,
          fix:
            'if a media/image URL the optimizer will fetch: allowlist the host ' +
            '(and register it in SEED_IMAGE_HOSTS when emitted from TS) — ' +
            'if a link URL (page/stream/doc): add its path shape to LINK_URL_EXEMPTIONS ' +
            'in scripts/lib/seed-image-hosts-core.mjs',
        });
      }
    }
  }
  return problems;
}

/**
 * Runs the full check. Returns { problems: [{ code, file, line?, message, fix }] }.
 * `moduleSource` / `configSource` / `seederSources` are injectable for tests;
 * when omitted they are read from disk under `root`.
 */
export function checkSeedImageHosts(
  root,
  { moduleSource, configSource, seederSources, emissionSources } = {}
) {
  const problems = [];
  const moduleAbs = path.join(root, MODULE_REL);
  const configAbs = path.join(root, WEB_CONFIG_REL);

  if (!moduleSource && !existsSync(moduleAbs)) {
    return [
      {
        code: 'NO_MODULE',
        file: MODULE_REL,
        message:
          'seed-image-hosts module is missing — seeders have no single source of truth for media hosts',
        fix: `create ${MODULE_REL} with a SEED_IMAGE_HOSTS map`,
      },
    ];
  }
  if (!configSource && !existsSync(configAbs)) {
    return [
      {
        code: 'NO_WEB_CONFIG',
        file: WEB_CONFIG_REL,
        message: 'web next.config.js not found — cannot verify the image allowlist',
        fix: 'create apps/web/next.config.js with images.remotePatterns',
      },
    ];
  }

  const modSrc = moduleSource ?? readFileSync(moduleAbs, 'utf8');
  const cfgSrc = configSource ?? readFileSync(configAbs, 'utf8');

  const seed = extractSeedHosts(modSrc);
  if (seed.error)
    return [
      {
        code: 'MODULE_UNPARSEABLE',
        file: MODULE_REL,
        message: seed.error,
        fix: 'keep the SEED_IMAGE_HOSTS const intact',
      },
    ];
  const allow = extractAllowlistedHosts(cfgSrc);
  if (allow.error)
    return [
      {
        code: 'WEB_CONFIG_UNPARSEABLE',
        file: WEB_CONFIG_REL,
        message: allow.error,
        fix: 'keep the images.remotePatterns array intact',
      },
    ];

  // Rule 1: every seed host must be allowlisted in the web config.
  for (const host of seed.hosts) {
    if (!allow.hosts.includes(host)) {
      problems.push({
        code: 'HOST_NOT_ALLOWLISTED',
        file: MODULE_REL,
        message: `seed host "${host}" is registered but missing from apps/web/next.config.js images.remotePatterns — seeded records using it will crash next/image at render time`,
        fix: `add { protocol: 'https', hostname: '${host}' } to images.remotePatterns`,
      });
    }
  }

  // Rule 2: no seeder may emit a raw URL literal to an unregistered host.
  const sources =
    seederSources ??
    Object.fromEntries(
      collectSeederFiles(root).map((rel) => [rel, readFileSync(path.join(root, rel), 'utf8')])
    );
  for (const [rel, source] of Object.entries(sources)) {
    if (rel === MODULE_REL) continue; // the registry itself lists every host by design
    const lines = source.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const m of lines[i].matchAll(/https?:\/\/([a-zA-Z0-9.-]+)/g)) {
        const host = m[1];
        if (LINK_HOST_EXEMPTIONS.has(host)) continue;
        const registered = seed.hosts.includes(host);
        problems.push({
          code: 'HARDCODED_MEDIA_URL',
          file: rel,
          line: i + 1,
          message: registered
            ? `raw URL to registered host "${host}" — even registered hosts must be built via seedImageUrl()/seedImages so all emission stays in one place`
            : `raw URL to unregistered host "${host}" — seeders must build media URLs via seedImageUrl()/seedImages (scripts/seeders/seed-image-hosts.ts) so every host is verified against the web allowlist`,
          fix: registered
            ? 'use an existing seedImages builder (scripts/seeders/seed-image-hosts.ts)'
            : 'register the host in SEED_IMAGE_HOSTS + the web allowlist, then route through a seedImages builder',
        });
      }
    }
  }

  // Rule 3: the emission-level diff — every host emitted by non-TS seed data
  // (demo-content SQL/CSV/backups, database scripts) must be covered by the
  // web allowlist (exact or wildcard), with link-URL exemptions. TS seeders
  // are rule 2's domain; re-scanning them would double-flag the same line.
  problems.push(
    ...diffSeederEmissions(root, {
      seedHosts: seed.hosts,
      allowHosts: allow.hosts,
      emissionSources,
    })
  );

  // Rule 4: minimality — no allowlist entry may be redundant with another
  // (wildcard or exact). dedupe:false so a literal duplicate is caught too.
  problems.push(...diffAllowlistRedundancy(cfgSrc));

  return problems;
}
