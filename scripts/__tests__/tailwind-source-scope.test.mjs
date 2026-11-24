/**
 * Tests for apps/web's Tailwind v4 scan scope
 * (the `@source` directives in apps/web/src/app/globals.css).
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 *
 * Tailwind v4 detects sources automatically, starting from the app's own
 * directory, and a class in a file it never opens produces no CSS — no build
 * error, no warning, just an unstyled element. That is a second, independent way
 * to lose the design system: `no-undefined-az-utility` proves the token exists in
 * the generated theme, and a token that exists still renders nothing if the
 * stylesheet is compiled without ever seeing the file that uses it. `packages/ui`
 * hit exactly this — 148 import sites in apps/web, and every class name the
 * library carries was invisible to the compiler until `@source` pointed at it.
 *
 * So the contract is: any workspace outside apps/web that ships `az-*` classes in
 * component source must sit inside apps/web's declared scan scope.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const GLOBALS = path.join(ROOT, 'apps', 'web', 'src', 'app', 'globals.css');

const UTILITY_RE =
  /\b(?:[a-z-]+:)*!?(?:bg|text|border|ring|fill|stroke|outline|decoration|divide|placeholder|accent|caret|from|via|to|shadow|rounded|blur|font|tracking|leading|z|p|px|py|pt|pb|pl|pr|m|mx|my|gap|size|w|h)(?:-[a-z])?-az-[a-z0-9-]+/;

/** The directories apps/web declares beyond its own tree, resolved. */
function declaredSources() {
  const css = fs.readFileSync(GLOBALS, 'utf8');
  return [...css.matchAll(/@source\s+['"]?([^'";\s]+)['"]?/g)].map((m) =>
    path.resolve(path.dirname(GLOBALS), m[1])
  );
}

/** Every workspace source dir outside apps/web that ships an `az-*` class. */
function consumersOfTheTheme() {
  const found = [];
  for (const group of ['packages', 'apps']) {
    for (const entry of fs.readdirSync(path.join(ROOT, group), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(ROOT, group, entry.name);
      if (dir === path.join(ROOT, 'apps', 'web')) continue;
      const src = path.join(dir, 'src');
      if (!fs.existsSync(src)) continue;
      if (listsAzClasses(src)) found.push(src);
    }
  }
  return found;
}

function listsAzClasses(dir) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.next') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (listsAzClasses(p)) return true;
    } else if (/\.tsx$/.test(e.name) && UTILITY_RE.test(fs.readFileSync(p, 'utf8'))) {
      return true;
    }
  }
  return false;
}

const insideSource = (dir, sources) =>
  sources.some((s) => dir === s || dir.startsWith(s + path.sep));

test('apps/web declares a scan scope beyond its own directory', () => {
  const sources = declaredSources();
  assert.ok(sources.length > 0, 'no @source directive in apps/web/src/app/globals.css');
});

test('every declared source directory exists', () => {
  // A stale path is the dangerous kind of typo here: lint stays green, the
  // package stops being scanned, and its components quietly render unstyled.
  for (const source of declaredSources()) {
    assert.ok(
      fs.existsSync(source),
      `@source ${path.relative(ROOT, source)} does not resolve to a directory`
    );
  }
});

test('every workspace that ships az-* classes is inside apps/web scan scope', () => {
  const sources = declaredSources();
  const unscanned = consumersOfTheTheme().filter((dir) => !insideSource(dir, sources));
  assert.deepEqual(
    unscanned.map((d) => path.relative(ROOT, d)),
    [],
    'Tailwind never opens these files, so their az-* utilities are not generated'
  );
});

test('the shared component library is the consumer this guard exists for', () => {
  // Not redundant with the test above: this pins that the guard still sees real
  // work. If packages/ui stops shipping az-* classes the scan entry can go, and
  // the third test would pass while the one thing it protects is gone.
  const ui = path.join(ROOT, 'packages', 'ui', 'src');
  assert.ok(listsAzClasses(ui), 'packages/ui/src should still carry az-* utilities');
  assert.ok(insideSource(ui, declaredSources()));
});
