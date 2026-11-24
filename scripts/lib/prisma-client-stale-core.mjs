/**
 * Core of the stale-Prisma-client check — parameterized by the repo `root` so
 * it can be unit-tested against fixture trees (see
 * scripts/__tests__/prisma-client-stale.test.mjs).
 *
 * The problem: every workspace's generated Prisma client is gitignored
 * (the "prisma/client" and "generated/prisma" glob patterns in .gitignore),
 * so a stale client can never be committed — but it absolutely can exist in a
 * working tree: someone edits `prisma/schema.prisma`, forgets `prisma
 * generate`, and then typecheck/tests/builds run against the OLD generated
 * types. The root `test`/`typecheck` scripts regenerate everything first,
 * but a single workspace `pnpm --filter <svc> test` (or a cached CI job that
 * skips `prisma:generate`) runs against whatever is on disk — stale and
 * silently wrong.
 *
 * The check: `prisma generate` embeds a formatted copy of the schema inside
 * the generated client output directory (`<output>/schema.prisma`, same place
 * for both custom `output` dirs and the default `node_modules/.prisma`
 * location). Comparing that copy against the canonical
 * `<ws>/prisma/schema.prisma` detects a stale client.
 *
 * The comparison must be insensitive to what `prisma format` does to the
 * copy (all verified against real generated output):
 *   1. Column re-alignment and comment repositioning — fixed by comparing
 *      token streams (whitespace + comments dropped).
 *   2. Block-level attribute reordering (`@@map` / `@@index` / `@@unique`
 *      lines move into the formatter's canonical order within a model) —
 *      fixed by sorting each model's block-attribute groups.
 *   3. Field-level attribute reordering (`@db.Decimal(18, 2) @default(0)`
 *      becomes `@default(0) @db.Decimal(18, 2)` etc.) — fixed by sorting
 *      each field line's attribute groups.
 * Attribute order is semantically irrelevant in Prisma, so (2) and (3) are
 * safe freedoms. Anything that changes semantics — added/removed/reordered
 * FIELDS, changed attribute arguments, attributes moved BETWEEN fields,
 * changed models/enums — still shifts the canonical stream and fails.
 *
 * Coverage: every workspace whose schema declares a custom `output` is
 * verified against its own embedded copy. A schema WITHOUT a custom `output`
 * is verified against the shared default `node_modules/.prisma/client` —
 * resolved the way `@prisma/client` itself resolves it — but ONLY when it is
 * the single default-output schema in the repo (any default client is owned
 * by whichever default-output workspace generated last). With more than one
 * default-output schema the owner is ambiguous, so those are reported
 * `UNVERIFIED` (visible gap, never a false failure).
 *
 * Exit semantics live in the CLI wrapper (scripts/check-prisma-client-stale.mjs);
 * this module returns a structured result.
 */

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { collectPrismaSchemas } from './prisma-find-first-core.mjs';

/** Read the custom `output` path from a schema's generator block (schema.prisma path in, resolved path out). */
export function resolveClientOutputDir(schemaPath, schemaText = readFileSync(schemaPath, 'utf8')) {
  // Match the generator's output = "<path>" (single or double quotes).
  const m = /\boutput\s*=\s*(["'])([^"']+)\1/.exec(schemaText);
  if (!m) return null; // default location (node_modules/.prisma/client)
  return path.resolve(path.dirname(schemaPath), m[2]);
}

/** The embedded schema copy Prisma writes next to the generated client. */
export function embeddedSchemaPath(outputDir) {
  return path.join(outputDir, 'schema.prisma');
}

/**
 * Tokenize ONE schema line into comparison tokens: identifiers, numbers,
 * string contents, and single-char punctuation. Comments are dropped.
 * String literals are compared by their full contents (quotes normalized) so
 * renaming a mapped table or changing a default value is always detected.
 */
function tokenizeLine(line) {
  const tokens = [];
  let i = 0;
  const n = line.length;
  while (i < n) {
    const ch = line[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '/' && line[i + 1] === '/') break; // trailing // comment
    if (ch === '#') break; // trailing # comment
    if (ch === '/' && line[i + 1] === '*') {
      const end = line.indexOf('*/', i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let value = '';
      i++;
      while (i < n && line[i] !== quote) {
        if (line[i] === '\\' && i + 1 < n) {
          value += line[i + 1];
          i += 2;
          continue;
        }
        value += line[i];
        i++;
      }
      i++; // closing quote
      tokens.push(`"${value}"`);
      continue;
    }
    // Identifier / number / attribute (`@id`, `@@unique`, `@db.Decimal`) —
    // maximal run including leading `@` markers.
    if (/[A-Za-z0-9_$@]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$@]/.test(line[j])) j++;
      tokens.push(line.slice(i, j));
      i = j;
      continue;
    }
    tokens.push(ch); // punctuation: { } ( ) [ ] = ? , . :
    i++;
  }
  return tokens;
}

/**
 * Tokenize a whole schema: lines are tokenized separately (so the
 * canonicalizer can reason per field line), multi-line /* *\/ comments are
 * dropped, and the result is the array of per-line token arrays.
 */
function tokenizeSchemaLines(schemaText) {
  const lines = [];
  let inBlockComment = false;
  for (const rawLine of schemaText.split('\n')) {
    let line = rawLine;
    if (inBlockComment) {
      const end = line.indexOf('*/');
      if (end === -1) continue;
      line = line.slice(end + 2);
      inBlockComment = false;
    }
    // Detect a block comment that opens on this line (after code) — rare in
    // schemas; treat the rest of the line and following lines as comment.
    const open = line.indexOf('/*');
    let afterClose = line;
    if (open !== -1) {
      const close = line.indexOf('*/', open + 2);
      if (close === -1) {
        line = line.slice(0, open);
        inBlockComment = true;
      } else {
        afterClose = line.slice(0, open) + line.slice(close + 2);
        line = afterClose;
      }
    }
    const tokens = tokenizeLine(line);
    if (tokens.length > 0) lines.push(tokens);
  }
  return lines;
}

/**
 * Canonicalize a schema into a comparable flat token stream (see the module
 * header for the exact freedoms this bakes in). Field attribute groups sort
 * within their line; block `@@` attribute groups sort within their block.
 */
export function canonicalizeTokens(schemaText) {
  const lines = tokenizeSchemaLines(schemaText);
  const out = [];
  // Buffer of block-attribute lines (already tokenized) for the open block.
  let blockAttrs = [];
  const flushBlockAttrs = () => {
    blockAttrs.sort((a, b) => (a.join('\u0000') < b.join('\u0000') ? -1 : a.join('\u0000') > b.join('\u0000') ? 1 : 0));
    for (const l of blockAttrs) out.push(...l);
    blockAttrs = [];
  };
  for (const lineTokens of lines) {
    if (lineTokens[0].startsWith('@@')) {
      blockAttrs.push(lineTokens);
      continue;
    }
    if (lineTokens[0] === '}') flushBlockAttrs();
    // Field line: split attribute groups (tokens from each '@...' onward,
    // paren-matched) and sort them — the formatter reorders field attributes.
    if (lineTokens[0].startsWith('@') === false && lineTokens.includes('@') === false && !lineTokens.some((t) => t.startsWith('@'))) {
      out.push(...lineTokens);
      continue;
    }
    const attrs = [];
    let prefix = [];
    let i = 0;
    while (i < lineTokens.length) {
      if (lineTokens[i].startsWith('@')) {
        const group = [lineTokens[i]];
        i++;
        // Absorb the attribute's argument tokens (e.g. `@db`, `.`, `Decimal`,
        // `(`, `18`, `,`, `2`, `)`) up to the end of the line; paren-matched
        // groups keep function-style args intact.
        while (i < lineTokens.length && !lineTokens[i].startsWith('@')) {
          group.push(lineTokens[i]);
          i++;
        }
        attrs.push(group);
        continue;
      }
      prefix.push(lineTokens[i]);
      i++;
    }
    if (attrs.length === 0) {
      out.push(...lineTokens);
      continue;
    }
    attrs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    out.push(...prefix, ...attrs.flat());
  }
  flushBlockAttrs();
  return out;
}

/** Keep the historical flat-tokenizer export for direct tokenizer tests. */
export function tokenizeSchema(schemaText) {
  return tokenizeSchemaLines(schemaText).flat();
}

/**
 * True when both schemas are semantically identical for staleness purposes:
 * equal canonical token streams (modulo whitespace, comments, and the
 * formatter's attribute reordering — see module header).
 */
export function schemaTokensMatch(sourceText, embeddedText) {
  const a = canonicalizeTokens(sourceText);
  const b = canonicalizeTokens(embeddedText);
  if (a.length !== b.length) return false;
  return a.every((t, i) => t === b[i]);
}

/** The status of one workspace's generated-client freshness. */
const STALE = 'STALE';
const FRESH = 'FRESH';
const MISSING = 'MISSING';
const UNVERIFIED = 'UNVERIFIED';
export const STATUSES = { STALE, FRESH, MISSING, UNVERIFIED };

/**
 * Check one workspace's schema/embedded-copy pair. When `root` is given,
 * workspace/schema paths are reported relative to it (repo-convention style,
 * e.g. `services/core/demo`); otherwise they are reported as given.
 * @returns {{ workspace: string, schema: string, status: string, detail?: string }}
 */
export function checkWorkspace(workspace, schemaPath, root = null, defaultEmbeddedPath = null) {
  const rel = (p) => (root ? path.relative(root, p) : p).split(path.sep).join('/');
  const workspaceRel = rel(workspace);
  const schemaRel = rel(schemaPath);
  const schemaText = readFileSync(schemaPath, 'utf8');
  const outputDir = resolveClientOutputDir(schemaPath, schemaText);

  if (!outputDir) {
    // Default-location generator. The client lands wherever `@prisma/client`
    // resolves the default `.prisma/client` from — with pnpm that is inside
    // the virtual store, so it must be resolved the way Node resolves
    // `@prisma/client` FROM THIS WORKSPACE. That resolution is only
    // attributable when this is the repo's single default-output schema
    // (the caller enforces that by passing `defaultEmbeddedPath` or not).
    if (!defaultEmbeddedPath) {
      return { workspace: workspaceRel, schema: schemaRel, status: UNVERIFIED, detail: 'no custom `output` — shared default client location cannot be attributed per-workspace (add output = "../src/prisma/client" to verify)' };
    }
    if (!existsSync(defaultEmbeddedPath)) {
      return { workspace: workspaceRel, schema: schemaRel, status: UNVERIFIED, detail: `no generated client at the resolved default location ${defaultEmbeddedPath.split(path.sep).join('/')} (run: pnpm run prisma:generate)` };
    }
    return compareEmbedded(workspaceRel, schemaRel, schemaText, defaultEmbeddedPath);
  }

  const embedded = embeddedSchemaPath(outputDir);
  if (!existsSync(embedded)) {
    return { workspace: workspaceRel, schema: schemaRel, status: MISSING, detail: `generated client has no schema copy at ${embedded.split(path.sep).join('/')} (run prisma generate)` };
  }
  return compareEmbedded(workspaceRel, schemaRel, schemaText, embedded);
}

function compareEmbedded(workspaceRel, schemaRel, schemaText, embeddedPath) {
  let embeddedText;
  try {
    embeddedText = readFileSync(embeddedPath, 'utf8');
  } catch (err) {
    return { workspace: workspaceRel, schema: schemaRel, status: UNVERIFIED, detail: `embedded schema unreadable: ${err.message}` };
  }
  if (schemaTokensMatch(schemaText, embeddedText)) {
    return { workspace: workspaceRel, schema: schemaRel, status: FRESH };
  }
  return { workspace: workspaceRel, schema: schemaRel, status: STALE, detail: 'schema.prisma changed since the client was generated (run: pnpm run prisma:generate)' };
}

/**
 * Resolve the embedded schema copy of the DEFAULT `.prisma/client` location
 * the way `@prisma/client` itself resolves it: require-resolution of
 * `@prisma/client/package.json` from `workspaceDir`, then the `.prisma/client`
 * package installed beside it. Returns null when `@prisma/client` does not
 * resolve from the workspace (fresh clone before install) — never throws.
 */
export function resolveDefaultEmbeddedSchema(workspaceDir) {
  try {
    const req = createRequire(path.join(workspaceDir, 'package.json'));
    const prismaClientPkg = req.resolve('@prisma/client/package.json');
    // <nm>/@prisma/client/package.json -> <nm>/.prisma/client/schema.prisma
    // (the default .prisma package sits in the same node_modules as @prisma/client)
    return path.join(path.dirname(path.dirname(path.dirname(prismaClientPkg))), '.prisma', 'client', 'schema.prisma');
  } catch {
    return null;
  }
}

/**
 * Run the stale-client check across every canonical schema in the repo.
 * @returns {{ results: Array, stale: string[], missing: string[], unverified: string[] }}
 */
export function runStaleClientChecks(root) {
  const schemaPaths = collectPrismaSchemas(root);
  const defaultOutput = schemaPaths.filter((s) => resolveClientOutputDir(s) === null);
  // The default client is attributable only when exactly one workspace owns it.
  const defaultEmbeddedPath =
    defaultOutput.length === 1 ? resolveDefaultEmbeddedSchema(path.dirname(path.dirname(defaultOutput[0]))) : null;
  const results = [];
  for (const schemaPath of schemaPaths) {
    const workspace = path.dirname(path.dirname(schemaPath));
    results.push(checkWorkspace(workspace, schemaPath, root, defaultEmbeddedPath));
  }
  const stale = results.filter((r) => r.status === STALE).map((r) => r.workspace);
  const missing = results.filter((r) => r.status === MISSING).map((r) => r.workspace);
  const unverified = results.filter((r) => r.status === UNVERIFIED).map((r) => r.workspace);
  return { results, stale, missing, unverified };
}
