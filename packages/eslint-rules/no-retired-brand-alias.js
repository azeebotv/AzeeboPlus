/**
 * ESLint rule: no-retired-brand-alias
 *
 * `globals.css` still defines the pre-Figma alias layer (`--brand-orange`,
 * `--hp-card-bg`, …) because the internal consoles read it, but the public
 * surface has a single source of truth: `packages/design-tokens`, which emits
 * `--color-az-*`. Every `var(--brand-orange)` left in a page is one more place
 * the accent has to be edited by hand, which is precisely the promise the
 * design system exists to keep — the display font and the accent ramp are each
 * a one-line change *only* if nothing bypasses them.
 *
 * The aliases here are the ones with a canonical equivalent. `--text-primary`,
 * `--text-secondary` and `--text-tertiary` are deliberately absent: they flip
 * per theme in `globals.css`, and the `--color-az-*` ramp is static, so mapping
 * them would silently break light mode.
 *
 * The categorical hues (`--brand-purple|pink|cyan|teal|indigo|grey|…`) were
 * absent from this rule for a while because they matched no az token at all —
 * banning them would have forced a wrong substitution. They now have one:
 * `categoryColors` in the registry, emitted as `--color-az-category-*`, and
 * `globals.css` redeclares each alias as a pointer at that token. Same for
 * `--brand-green`/`--brand-amber`: they were kept out while their only app-code
 * use was the genre palette, where the hex names an identity rather than a
 * status. `/music/genres` now reads `--color-az-category-*` for its identities,
 * so what is left of those two is a plain copy of `az-success-500`/
 * `az-warning-500` and nothing more.
 *
 * Options:
 *   aliases: Record<string, string> - alias name -> canonical custom property
 */

const DEFAULT_ALIASES = {
  '--brand-orange': '--color-az-flame',
  '--brand-red': '--color-az-scarlet',
  '--brand-white': '--color-az-ink',
  '--brand-near-black': '--color-az-surface-root',
  '--hp-bg': '--color-az-surface-root',
  '--hp-bg-alt': '--color-az-surface-raised',
  '--hp-card-bg': '--color-az-surface-panel',
  '--hp-card-border': '--color-az-glass-border',
  '--hp-divider': '--color-az-glass-fill',
  // The tier metals. Both are hex-identical, and the generator now emits them;
  // `--brand-copper` is what the medal code calls the bronze tier.
  '--brand-copper': '--color-az-accent-bronze',
  '--brand-silver': '--color-az-accent-silver',
  // Rewards gold used to be #FFD700 here while the registry medal was #FBBF24 —
  // two golds for one concept. The alias now reads the registry value.
  '--brand-gold': '--color-az-accent-gold',
  // Categorical subject hues, registered as `categoryColors`.
  '--brand-purple': '--color-az-category-violet',
  '--brand-purple-light': '--color-az-category-violet-light',
  '--brand-pink': '--color-az-category-pink',
  '--brand-cyan': '--color-az-category-cyan',
  '--brand-teal': '--color-az-category-teal',
  '--brand-indigo': '--color-az-category-indigo',
  '--brand-sky': '--color-az-category-sky',
  '--brand-crimson': '--color-az-category-crimson',
  '--brand-emerald': '--color-az-category-emerald',
  '--brand-forest': '--color-az-category-forest',
  '--brand-grey': '--color-az-ink-muted',
  // Exact copies of the status ramp. Out of the map while /music/genres used
  // them as genre identities; that palette moved to `--color-az-category-*`, so
  // the only readers left are the internal consoles.
  '--brand-green': '--color-az-success-500',
  '--brand-amber': '--color-az-warning-500',
};

// `var(--brand-orange, #EC691F)` carries a fallback that survives the swap; the
// alias name itself is what must go.
function patternFor(names) {
  return new RegExp(String.raw`var\(\s*(${names.map(escapeRe).join('|')})\s*[,)]`, 'g');
}

function escapeRe(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function create(context) {
  const options = context.options[0] || {};
  const aliases = options.aliases || DEFAULT_ALIASES;
  const names = Object.keys(aliases);
  const regex = patternFor(names);
  const sourceCode = context.sourceCode || context.getSourceCode();

  function check(text, node) {
    regex.lastIndex = 0;
    const hits = [];
    let match;
    while ((match = regex.exec(text))) hits.push(match[1]);
    if (hits.length === 0) return;

    const unique = [...new Set(hits)];
    context.report({
      node,
      loc: node.loc.start,
      messageId: 'retiredAlias',
      data: {
        aliases: unique.join(', '),
        canonical: unique.map((name) => aliases[name]).join(', '),
        count: hits.length,
      },
      fix(fixer) {
        // Textual swap only: an arbitrary-value class keeps its shape, so
        // `text-[var(--brand-orange)]` becomes `text-[var(--color-az-flame)]`.
        // Shortening that to `text-az-flame` is a separate, hand-verified step.
        // The raw source is rewritten rather than the cooked value so the
        // node's own delimiters survive — a template element carries its
        // backticks and `${`, and a JSX attribute its quotes.
        const raw = sourceCode.getText(node);
        let output = raw;
        // Longest name first: `--brand-purple` is a prefix of
        // `--brand-purple-light`, and a plain split would rewrite the tail of
        // the longer alias into `--color-az-category-violet-light`.
        for (const name of [...unique].sort((a, b) => b.length - a.length)) {
          output = output.split(`var(${name}`).join(`var(${aliases[name]}`);
          output = output.split(`var( ${name}`).join(`var(${aliases[name]}`);
        }
        if (output === raw) return null;
        return fixer.replaceText(node, output);
      },
    });
  }

  return {
    Literal(node) {
      if (typeof node.value === 'string') check(node.value, node);
    },
    TemplateElement(node) {
      check(node.value.cooked ?? node.value.raw, node);
    },
    JSXText(node) {
      check(node.value, node);
    },
  };
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow the pre-design-system brand/surface CSS-variable aliases in favour of --color-az-*',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    messages: {
      retiredAlias:
        "'{{aliases}}' is a retired alias layer ({{count}} use(s) here). Use the canonical token instead: {{canonical}}. The alias only exists for the internal consoles; every reference kept in app code is one more edit when the accent changes.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          aliases: {
            type: 'object',
            additionalProperties: { type: 'string' },
            description: 'Retired alias -> canonical custom property',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create,
  // Exported so `eslint.config.js` can wire the *same* map rather than keeping a
  // second copy: a literal in the config would be what ESLint actually enforces,
  // while this file's own tests would still pass against the stale default.
  DEFAULT_ALIASES,
};
