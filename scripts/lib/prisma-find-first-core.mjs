/**
 * Core of the Prisma `findFirst`-vs-`findUnique` check — parameterized by the
 * repo `root` so it can be unit-tested against fixture trees (see
 * scripts/__tests__/prisma-find-first.test.mjs).
 *
 * The rule: a `findFirst`/`findFirstOrThrow`/`findMany` whose `where:` argument
 * filters on exactly the field(s) of a `@id` / `@unique` / `@@unique` constraint
 * is a fallback that should be `findUnique` — the unique finder is type-checked,
 * documented, and (for single-field keys) indexed. `findMany` on a unique key is
 * the same "fetch a 0-or-1 list and take `[0]`" fallback in list clothing. This
 * is the class of drift the GeoRestriction `countryCode` audit chased: once a
 * `@unique` finder exists, `findFirst({ where: { countryCode } })` can silently
 * reappear and mask the constraint.
 *
 * Deliberately NOT flagged (so the rule stays low-noise):
 *  - `where` on a non-unique field set (e.g. `{ userId, status, endTime }`)
 *  - `where` with extra fields beyond the unique key (e.g. `{ key, isPublic }`)
 *  - `where` whose value is a filter object (e.g. `{ id: { in: [...] } }`,
 *    `{ email: { contains: "x" } }`) — those are not unique-key lookups
 *  - `where` passed as a variable (not statically analyzable)
 *  - `orderBy`/`take`/`skip`-driven lookups that happen to also carry a unique
 *    field in `where` alongside other fields — only an exact field-set match on
 *    the whole `where` is reported
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/** Normalize reported relative paths to forward slashes so violations read the
 *  same on every platform (Windows `path.relative` emits backslashes). */
const toPosix = (p) => p.split(path.sep).join('/');

/** Directories that never contain source files to scan. */
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.next',
  'coverage',
  'generated',
  'build',
  '.git',
]);

const TEST_FILE_RE = /\.(?:spec|test|e2e-spec)\.(?:ts|tsx)$/;
const TS_FILE_RE = /\.tsx?$/;

/** `.<model>[?].findFirst(`, `findFirstOrThrow(`, or `findMany(`. */
const FIND_RE = /\.([A-Za-z_$][\w$]*)\??\.(findFirst(?:OrThrow)?|findMany)\s*\(/g;

const lowerFirst = (name) => name[0].toLowerCase() + name.slice(1);
const isQuote = (ch) => ch === '"' || ch === "'" || ch === '`';
const isIdentStart = (ch) => /[A-Za-z_$]/.test(ch);
const isIdentChar = (ch) => /[A-Za-z0-9_$]/.test(ch);

/**
 * Parse one Prisma schema into `Map<delegateName, { model, constraints }>`
 * where each constraint is the list of field names of a unique finder
 * (`@id`, `@unique`, `@@id`, `@@unique`).
 */
export function parseSchema(schemaText) {
  const models = new Map();
  const lines = schemaText.split('\n');
  let current = null;
  for (const line of lines) {
    const trimmed = line.trim();
    const modelMatch = /^model\s+(\w+)\s*\{/.exec(trimmed);
    if (modelMatch) {
      current = { model: modelMatch[1], constraints: [] };
      models.set(lowerFirst(modelMatch[1]), current);
      continue;
    }
    if (!current) continue;
    if (trimmed.startsWith('}')) {
      current = null;
      continue;
    }
    // Compound primary key / unique: `@@id([a, b])`, `@@unique([a, b])`,
    // `@@unique(fields: [a, b], name: "…")`.
    if (/^@@unique\s*\(/.test(trimmed) || /^@@id\s*\(/.test(trimmed)) {
      const m = /\[([^\]]*)\]/.exec(trimmed);
      const fields = m ? m[1].split(',').map((s) => s.trim()).filter(Boolean) : [];
      if (fields.length > 0) current.constraints.push(fields);
      continue;
    }
    // Single-field unique: `id String @id`, `email String @unique`.
    const fieldMatch = /^(\w+)\s+\S/.exec(trimmed);
    if (fieldMatch && (/\s@id\b/.test(line) || /\s@unique\b/.test(line))) {
      const field = fieldMatch[1];
      if (!current.constraints.some((c) => c.length === 1 && c[0] === field)) {
        current.constraints.push([field]);
      }
    }
  }
  return models;
}

/** Canonical `prisma/schema.prisma` files, one per deployable workspace. */
export function collectPrismaSchemas(root) {
  const schemas = [];
  const roots = [];
  const addDir = (dir) => {
    if (existsSync(dir)) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) roots.push(path.join(dir, entry.name));
      }
    }
  };
  addDir(path.join(root, 'packages'));
  addDir(path.join(root, 'apps'));
  const servicesDir = path.join(root, 'services');
  if (existsSync(servicesDir)) {
    for (const group of readdirSync(servicesDir, { withFileTypes: true })) {
      if (!group.isDirectory()) continue;
      const groupDir = path.join(servicesDir, group.name);
      for (const ws of readdirSync(groupDir, { withFileTypes: true })) {
        if (ws.isDirectory()) roots.push(path.join(groupDir, ws.name));
      }
    }
  }
  for (const ws of roots) {
    const schema = path.join(ws, 'prisma', 'schema.prisma');
    if (existsSync(schema)) schemas.push(schema);
  }
  return schemas;
}

/** All production `.ts`/`.tsx` files, skipping generated clients and tests. */
export function collectSourceFiles(root) {
  const files = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        // Generated Prisma client output: `<ws>/prisma/client/**` and
        // `<ws>/src/prisma/client/**` (also `runtime`).
        if ((entry.name === 'client' || entry.name === 'runtime') && path.basename(dir) === 'prisma') {
          continue;
        }
        walk(path.join(dir, entry.name));
      } else if (TS_FILE_RE.test(entry.name) && !/\.d\.ts$/.test(entry.name) && !TEST_FILE_RE.test(entry.name)) {
        files.push(path.join(dir, entry.name));
      }
    }
  };
  walk(root);
  return files;
}

/** Index of the `)` matching the `(` at `openIndex`, or -1. String-aware. */
function matchingParen(code, openIndex) {
  let depth = 0;
  let quote = null;
  for (let i = openIndex; i < code.length; i++) {
    const ch = code[i];
    if (quote) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (isQuote(ch)) {
      quote = ch;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Index of the first non-space char of top-level prop `name`'s value, or -1. */
function topLevelPropValue(text, openBraceIndex, name) {
  let depth = 1;
  let quote = null;
  let i = openBraceIndex + 1;
  while (i < text.length) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i++;
      continue;
    }
    if (isQuote(ch)) {
      quote = ch;
      i++;
      continue;
    }
    if (ch === '{' || ch === '(' || ch === '[') {
      depth++;
      i++;
      continue;
    }
    if (ch === '}' || ch === ')' || ch === ']') {
      depth--;
      if (depth === 0) return -1;
      i++;
      continue;
    }
    if (depth === 1 && isIdentStart(ch)) {
      let j = i;
      while (j < text.length && isIdentChar(text[j])) j++;
      const key = text.slice(i, j);
      let k = j;
      while (k < text.length && /\s/.test(text[k])) k++;
      if (text[k] === ':' && key === name) {
        let v = k + 1;
        while (v < text.length && /\s/.test(text[v])) v++;
        return v;
      }
      i = j;
      continue;
    }
    i++;
  }
  return -1;
}

/**
 * Top-level `where` entries of the object literal at `openBraceIndex`.
 * Returns `{ keys, allScalar }`: `keys` are the top-level property names
 * (including shorthand `{ id, userId }`), and `allScalar` is false when any
 * value is itself an object literal (`{ id: { in: [...] } }`) — filter
 * operators like `in`/`contains`/`gt` are not unique-key lookups.
 */
function parseWhereEntries(text, openBraceIndex) {
  const keys = [];
  let allScalar = true;
  let depth = 1;
  let quote = null;
  let expectKey = true; // true right after `{` or `,` at depth 1
  let i = openBraceIndex + 1;
  while (i < text.length) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i++;
      continue;
    }
    if (isQuote(ch)) {
      quote = ch;
      i++;
      continue;
    }
    if (ch === '{' || ch === '(' || ch === '[') {
      depth++;
      i++;
      continue;
    }
    if (ch === '}' || ch === ')' || ch === ']') {
      depth--;
      if (depth === 0) return { keys, allScalar };
      i++;
      continue;
    }
    if (ch === ',' && depth === 1) {
      expectKey = true;
      i++;
      continue;
    }
    if (depth === 1 && expectKey && isIdentStart(ch)) {
      let j = i;
      while (j < text.length && isIdentChar(text[j])) j++;
      const key = text.slice(i, j);
      let k = j;
      while (k < text.length && /\s/.test(text[k])) k++;
      // `...rest` spread (identifier preceded by `.`) is not a key.
      if (i > 0 && text[i - 1] === '.') {
        i = j;
        continue;
      }
      if (text[k] === ':') {
        keys.push(key);
        let v = k + 1;
        while (v < text.length && /\s/.test(text[v])) v++;
        if (text[v] === '{') allScalar = false;
        expectKey = false; // value position follows `key:`
        i = k + 1;
        continue;
      }
      if (text[k] === ',' || text[k] === '}') {
        keys.push(key); // shorthand → scalar identifier
        i = j;
        continue;
      }
      i = j;
      continue;
    }
    i++;
  }
  return { keys, allScalar };
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((x, i) => x === sb[i]);
}

/**
 * Run the findFirst→findUnique check against the tree rooted at `root`.
 * @returns {{ errors: string[], modelCount: number, constraintCount: number, fileCount: number }}
 */
export function runPrismaFindFirstChecks(root) {
  const errors = [];
  let modelCount = 0;
  let constraintCount = 0;

  const models = new Map();
  const schemas = collectPrismaSchemas(root);
  for (const schema of schemas) {
    const parsed = parseSchema(readFileSync(schema, 'utf8'));
    for (const [delegate, info] of parsed) {
      if (!models.has(delegate)) {
        models.set(delegate, info);
        modelCount++;
      }
      constraintCount += info.constraints.length;
    }
  }

  const files = collectSourceFiles(root);
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const rel = toPosix(path.relative(root, file));
    FIND_RE.lastIndex = 0;
    let m;
    while ((m = FIND_RE.exec(text)) !== null) {
      const delegate = m[1];
      const method = m[2];
      const info = models.get(delegate);
      if (!info) continue; // not a Prisma model
      const close = matchingParen(text, m.index + m[0].length - 1);
      if (close === -1) continue;
      const args = text.slice(m.index + m[0].length - 1 + 1, close);
      const openBrace = args.indexOf('{');
      if (openBrace === -1) continue;
      const whereValue = topLevelPropValue(args, openBrace, 'where');
      if (whereValue === -1) continue;
      if (args[whereValue] !== '{') continue; // `where: someVar` — not analyzable
      const { keys, allScalar } = parseWhereEntries(args, whereValue);
      if (keys.length === 0 || !allScalar) continue;
      const matched = info.constraints.some((c) => sameSet(c, keys));
      if (matched) {
        const lineNo = text.slice(0, m.index).split('\n').length;
        errors.push(
          `${rel}:${lineNo} — \`${info.model}.${method}\` filters on the unique key(s) ` +
            `\`${[...keys].sort().join(', ')}\`; use \`findUnique\` instead ` +
            `(a \`@id\`/\`@unique\`/\`@@unique\` finder exists on ${info.model})`
        );
      }
    }
  }

  return { errors, modelCount, constraintCount, fileCount: files.length };
}
