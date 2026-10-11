/**
 * ESLint rule: no-undefined-az-utility
 *
 * Tailwind v4 generates a utility only when the `@theme` block declares the
 * matching custom property, so `bg-az-accent-gold` compiled to nothing while
 * `colors.accent` sat in the registry unflattened: the class looked authored,
 * the element rendered unstyled, and the migration silently reached for
 * `bg-slate-300` instead. A near-miss name (`bg-az-surface` when the ramp ships
 * surface-root/raised/panel/edge) fails the same way.
 *
 * This rule reads the vocabulary the generator actually emitted and reports any
 * `az-*` class that has nothing behind it. It is the counterpart of
 * `no-off-system-color-utility`: that one bans the raw Tailwind palette, this
 * one guarantees the replacement exists.
 *
 * Two shapes are checked, because the design system uses both:
 *   • a prefixed utility (`bg-az-flame`, `rounded-az-pill`, `shadow-az-glow`),
 *     which needs a `--<namespace>-az-<name>` in the generated stylesheet;
 *   • a bare shared class (`az-glass`, `az-btn-primary--sm`), which needs a
 *     `.az-<name>` rule or `@utility az-<name>` block in globals.css.
 *
 * Options:
 *   themeStylesheet: string - path (relative to the linted file's workspace) to
 *                             the generated stylesheet
 *   sharedStylesheet: string - path to globals.css
 */

const fs = require('node:fs');
const path = require('node:path');

const DEFAULTS = {
  themeStylesheet: 'src/styles/design-tokens.css',
  sharedStylesheet: 'src/app/globals.css',
};

/**
 * Which @theme namespaces can satisfy a utility prefix. `shadow-az-*` and
 * `text-az-*` are ambiguous by design: Tailwind reads `shadow-az-glow` from the
 * shadow scale and `shadow-az-flame` from the colour ramp, so a name in either
 * namespace makes the utility live.
 */
const PREFIX_NAMESPACES = {
  bg: ['color'],
  text: ['color', 'text'],
  border: ['color'],
  ring: ['color'],
  fill: ['color'],
  stroke: ['color'],
  outline: ['color'],
  decoration: ['color'],
  divide: ['color'],
  placeholder: ['color'],
  accent: ['color'],
  caret: ['color'],
  from: ['color'],
  via: ['color'],
  to: ['color'],
  shadow: ['shadow', 'color'],
  rounded: ['radius'],
  blur: ['blur'],
  font: ['font'],
  tracking: ['tracking'],
  leading: ['leading'],
  z: ['z-index'],
  p: ['spacing'],
  px: ['spacing'],
  py: ['spacing'],
  pt: ['spacing'],
  pb: ['spacing'],
  pl: ['spacing'],
  pr: ['spacing'],
  ps: ['spacing'],
  pe: ['spacing'],
  m: ['spacing'],
  mx: ['spacing'],
  my: ['spacing'],
  mt: ['spacing'],
  mb: ['spacing'],
  ml: ['spacing'],
  mr: ['spacing'],
  gap: ['spacing'],
  size: ['spacing'],
  w: ['spacing'],
  h: ['spacing'],
};

const UTILITY_RE = /(^|[^a-z0-9-])((?:[a-z-]+:)*!?(?:bg|text|border|ring|fill|stroke|outline|decoration|divide|placeholder|accent|caret|from|via|to|shadow|rounded|blur|font|tracking|leading|z|p[xytrblse]?|m[xytrblse]?|gap|size|w|h)(?:-[a-z])?-az-[a-z0-9-]+)/g;
const BARE_CLASS_RE = /(^|[\s"`'])(az-[a-z0-9]+(?:[-_][a-z0-9]+)*(?:--[a-z0-9-]+)?)/g;

const cache = new Map();

/** Read the emitted vocabulary once per stylesheet pair. */
function vocabularyFor(themePath, sharedPath) {
  const key = `${themePath}|${sharedPath}`;
  if (cache.has(key)) return cache.get(key);

  const namespaces = new Map();
  if (fs.existsSync(themePath)) {
    const css = fs.readFileSync(themePath, 'utf8');
    for (const match of css.matchAll(/--([a-z-]+)-az-([\w-]+):/g)) {
      // `--text-az-body--line-height` declares the body role's line-height, not a
      // role named "body--line-height".
      const name = match[2].split('--')[0];
      if (!namespaces.has(match[1])) namespaces.set(match[1], new Set());
      namespaces.get(match[1]).add(name);
    }
  }

  const shared = new Set();
  // Shared classes live in globals.css as `.az-*`, and the generated theme adds
  // the type roles as `@utility az-*`; both are definitions a page may use.
  for (const [file, exists] of [
    [themePath, fs.existsSync(themePath)],
    [sharedPath, fs.existsSync(sharedPath)],
  ]) {
    if (!exists) continue;
    const css = fs.readFileSync(file, 'utf8');
    for (const match of css.matchAll(/@utility\s+(az-[\w-]+)/g)) shared.add(match[1]);
    for (const match of css.matchAll(/\.(az-[\w-]+)/g)) shared.add(match[1]);
  }

  const vocabulary = { namespaces, shared, present: namespaces.size > 0 || shared.size > 0 };
  cache.set(key, vocabulary);
  return vocabulary;
}

/** Walk up from the linted file to the workspace that owns the stylesheet. */
function workspaceRoot(filename, relative) {
  let dir = path.dirname(path.resolve(filename));
  for (let up = 0; up < 8 && dir !== path.dirname(dir); up++) {
    if (fs.existsSync(path.join(dir, relative))) return dir;
    dir = path.dirname(dir);
  }
  return null;
}

function create(context) {
  const options = context.options[0] || {};
  const themeRelative = options.themeStylesheet || DEFAULTS.themeStylesheet;
  const sharedRelative = options.sharedStylesheet || DEFAULTS.sharedStylesheet;
  const filename = context.filename || context.getFilename();

  /* Both paths are resolved against the workspace that owns the generated
     theme, found by walking up from the linted file so the rule behaves the same
     when ESLint runs from the repo root or from inside apps/web. An absolute
     option pins a stylesheet outright, which is how the unit tests stub one. */
  let root = path.isAbsolute(themeRelative) ? null : workspaceRoot(filename, themeRelative);
  // Not an app wired to the generated theme (a service, a package, a fixture
  // outside one) — there is no vocabulary for the file to be outside of.
  if (!root && !path.isAbsolute(themeRelative)) return {};
  const themePath = path.isAbsolute(themeRelative) ? themeRelative : path.join(root, themeRelative);
  const sharedPath = path.isAbsolute(sharedRelative)
    ? sharedRelative
    : path.join(root || path.dirname(themePath), sharedRelative);

  const vocabulary = vocabularyFor(themePath, sharedPath);
  if (!vocabulary.present) return {};

  const sourceCode = context.sourceCode || context.getSourceCode();

  function checkText(text, node) {
    const reported = new Set();

    UTILITY_RE.lastIndex = 0;
    for (const match of text.matchAll(UTILITY_RE)) {
      const token = match[2];
      const bare = token.split(':').pop().replace(/^!/, '').split('/')[0];
      const parts = bare.split('-');
      const prefix = parts[0];
      // Everything before `az` is the utility and, in Tailwind's axis form, one
      // more segment: `border-t-az-flame`, `divide-y-az-glass-fill`.
      const azAt = parts.lastIndexOf('az');
      if (azAt < 1) continue;
      const name = parts.slice(azAt + 1).join('-');
      if (!name) continue;
      const namespaces = PREFIX_NAMESPACES[prefix];
      if (!namespaces) continue;
      const alive = namespaces.some((ns) => vocabulary.namespaces.get(ns)?.has(name));
      if (alive || reported.has(bare)) continue;
      reported.add(bare);
      context.report({
        node,
        loc: node.loc.start,
        messageId: 'undefinedUtility',
        data: { token: bare, prefix, name },
      });
    }

    BARE_CLASS_RE.lastIndex = 0;
    for (const match of text.matchAll(BARE_CLASS_RE)) {
      const token = match[2];
      if (vocabulary.shared.has(token) || reported.has(token)) continue;
      reported.add(token);
      context.report({
        node,
        loc: node.loc.start,
        messageId: 'undefinedSharedClass',
        data: { token },
      });
    }
  }

  return {
    Literal(node) {
      if (typeof node.value === 'string') checkText(node.value, node);
    },
    TemplateElement(node) {
      checkText(node.value.raw, node);
    },
    JSXText(node) {
      checkText(node.value, node);
    },
  };
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow az-* classes and utilities that no generated token or shared rule defines, which render as nothing',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    messages: {
      undefinedUtility:
        "'{{token}}' has no '--{{name}}' entry in the {{prefix}} namespace of the generated theme, so Tailwind emits no rule for it and the element renders unstyled. Use a name the stylesheet declares, or add the token to packages/design-tokens and run `pnpm tokens:css`.",
      undefinedSharedClass:
        "'{{token}}' is not defined by globals.css or the generated @utility roles. Use a shared class that exists, or add it to apps/web/src/app/globals.css so every page reads the same treatment.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          themeStylesheet: { type: 'string' },
          sharedStylesheet: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  create,
};
