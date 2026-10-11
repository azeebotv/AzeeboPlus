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
 * them would silently break light mode. `--brand-gold` is absent too: it is
 * #FFD700 while the registry accent token is #FBBF24, and its call sites mix
 * medal chrome with a carrier-identity hue. The other categorical hues
 * (`--brand-purple|pink|grey|sky|…`) match no az token, so they are not banned —
 * that gap is reported, not hidden behind a wrong substitution. `--brand-green`
 * and `--brand-amber` are exact copies of `az-success-500`/`az-warning-500` yet
 * stay out for the same reason: their remaining app-code use is the genre
 * palette on /music/genres, where the value is an identity, not a status.
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
        for (const name of unique) {
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
