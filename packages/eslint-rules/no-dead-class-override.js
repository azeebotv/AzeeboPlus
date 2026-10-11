/**
 * ESLint rule: no-dead-class-override
 *
 * `apps/web/src/app/globals.css` is loaded with plain rules — it opens with
 * `@import 'tailwindcss'` and never declares a `@layer`, so every `.az-*`
 * component class it defines is UNLAYERED. Unlayered styles beat everything in
 * a cascade layer, which means a Tailwind utility can never override them:
 *
 *   className="az-glass rounded-3xl shadow-2xl"   ← renders .az-glass's radius
 *                                                  and shadow; both utilities
 *                                                  are dead code.
 *
 * The danger is not cosmetic. A reader (or an agent) sees `rounded-3xl`,
 * believes the card is 24px, and "fixes" the wrong file when it doesn't match.
 * `--fix` drops the dead utility; if the surface genuinely wants a different
 * radius/fill/shadow, drop the shared class and compose the element from
 * utilities alone.
 *
 * This is the second half of the token story: `no-hex-colors` and
 * `no-arbitrary-hex-class` keep literal colours out of markup, this keeps the
 * shared component layer and the utility layer from describing the same
 * element differently.
 *
 * Options:
 *   sharedClasses: string[] - restrict the check to a subset of the table below
 */

// The table mirrors globals.css: the properties each shared class declares.
// Any utility for one of those properties on the same element is dead.
const SHARED_CLASSES = {
  'az-glass': ['background', 'backdrop-filter', 'border', 'border-radius', 'box-shadow'],
  'az-glass--glow': ['box-shadow'],
  'az-chip': ['background', 'backdrop-filter', 'border', 'border-radius'],
  'az-scrim': ['background'],
  'az-scrim--hero': ['background'],
  'az-text-gradient': ['background', 'color'],
  'az-btn-primary': [
    'background',
    'color',
    'font-weight',
    'font-size',
    'border',
    'border-radius',
    'width',
    'padding',
  ],
  'az-btn-primary--inline': ['width'],
  'az-btn-primary--sm': ['font-size', 'letter-spacing', 'padding'],
  'az-btn-social': [
    'display',
    'align-items',
    'justify-content',
    'gap',
    'border-radius',
    'padding',
    'font-size',
    'font-weight',
    'background',
    'border',
    'color',
  ],
  'az-input': ['width', 'background', 'border', 'border-radius', 'padding', 'color', 'font-size'],
  'az-input--trailing': ['padding-right'],
  'az-input--otp': ['width', 'height', 'padding', 'text-align', 'font-weight'],
  'az-label': [
    'display',
    'font-size',
    'font-weight',
    'text-transform',
    'letter-spacing',
    'color',
    'margin-bottom',
  ],
  'az-divider': ['display', 'align-items', 'gap', 'color', 'font-size', 'font-weight'],
  'az-ambient-red': ['background', 'filter'],
  'az-hero-title': ['font-size'],
  'az-headline': ['font-family', 'font-weight', 'line-height', 'letter-spacing'],
  'az-wordmark': ['font-family', 'font-weight', 'letter-spacing'],
};

// A utility that restates what the shared class already declares is redundant,
// not misleading — `az-glass border border-az-glass-border` renders exactly as
// written. Only a utility that DISAGREES lies to the reader, so these tokens
// are skipped. Keep in sync with globals.css.
const EQUIVALENT_TOKENS = {
  'az-glass': [
    'border',
    'border-az-glass-border',
    'bg-az-glass-card',
    'shadow-az-lifted',
    'hover:border-az-glass-border-hover',
  ],
  'az-chip': ['border', 'border-az-glass-border', 'bg-az-glass-fill', 'rounded-az-pill'],
  'az-btn-primary': [
    'border-none',
    'border-0',
    'w-full',
    'text-az-ink',
    'font-bold',
    'px-5',
    'py-4',
    'rounded-az-feature',
  ],
  'az-btn-primary--sm': ['px-7', 'text-az-overline'],
  'az-btn-primary--inline': ['w-auto'],
  'az-btn-social': [
    'flex',
    'items-center',
    'justify-center',
    'text-az-ink',
    'font-semibold',
    'rounded-az-control',
  ],
  'az-input': [
    'w-full',
    'border',
    'border-az-glass-border',
    'bg-az-glass-fill-hover',
    'rounded-az-panel',
    'text-az-ink',
  ],
  'az-input--otp': ['w-12', 'h-14', 'p-0', 'px-0', 'text-center', 'font-bold'],
  'az-hero-title': ['text-2xl'],
  'az-label': ['block', 'uppercase', 'font-bold', 'text-az-ink-muted', 'text-az-overline'],
  'az-headline': ['font-extrabold'],
};

const TEXT_SIZE_KEYWORDS = '(?:xs|sm|base|lg|xl|[2-9]xl)';
const TEXT_ALIGN = /^text-(?:left|center|right|justify|start|end|match|initial)(?:-|$)/;

// Each property maps to the Tailwind utilities that would fight it. Variant
// prefixes (hover:, sm:, disabled:) are stripped before matching: an unlayered
// rule outranks a layered utility no matter which variant carries it.
// `size-*` is deliberately absent from `width`: it also sets height, so
// dropping it would change the render instead of removing dead code.
const PROPERTY_MATCHERS = {
  background: /^bg-/,
  'backdrop-filter': /^backdrop-/,
  border: /^border(?:-[trblxyse])?(?:-|$)/,
  'border-radius': /^rounded(?:-|$)/,
  'box-shadow': /^shadow(?:-|$)/,
  color: /^text-/,
  'font-size': [new RegExp(`^text-${TEXT_SIZE_KEYWORDS}(?:-|$)`), /^text-\[[\d.]+[a-z%]+\]$/i],
  'font-weight':
    /^font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)(?:-|$)/,
  'font-family': /^font-(?:sans|serif|mono)(?:-|$)/,
  padding: /^(?:p|px|py|pt|pb|pl|pr|ps|pe)-/,
  'padding-right': /^(?:pr|pe)-/,
  height: /^h(?:-|$)/,
  'text-align': /^text-(?:left|center|right|justify|start|end|match|initial)(?:-|$)/,
  // Tailwind's `blur-*` writes the same `filter` property the shared classes do.
  filter: /^(?:filter|blur)(?:-|$)/,
  'margin-bottom': /^mb-/,
  gap: /^gap-/,
  'align-items': /^items-/,
  'justify-content': /^justify-/,
  display:
    /^(?:block|inline|inline-block|inline-flex|inline-grid|flex|grid|hidden|table|contents)$/,
  'letter-spacing': /^tracking(?:-|$)/,
  'line-height': /^leading-/,
  'text-transform': /^(?:uppercase|lowercase|capitalize|normal-case)$/,
  width: /^w-/,
};

// `text-az-ink` is a colour, `text-sm` is a size, `text-center` is neither —
// the keyword sets decide which property a `text-*` utility claims.
function textProperty(token) {
  if (TEXT_ALIGN.test(token)) return 'text-align';
  if (new RegExp(`^text-${TEXT_SIZE_KEYWORDS}(-|$)`).test(token)) return 'font-size';
  if (/^text-\[[\d.]+[a-z%]+\]$/.test(token)) return 'font-size';
  return 'color';
}

function stripVariants(token) {
  const parts = token.split(':');
  return parts[parts.length - 1];
}

// A `--modifier` class carries its owner's declarations too: .az-btn-primary--inline
// is applied on top of .az-btn-primary, not instead of it.
function sharedClassesIn(token) {
  const base = stripVariants(token);
  if (!base.startsWith('az-')) return [];
  if (!SHARED_CLASSES[base]) return [];
  // A `--modifier` class layers on top of its owner, so both rule sets apply.
  const owner = Object.keys(SHARED_CLASSES).find((name) => base.startsWith(`${name}--`));
  return owner ? [base, owner] : [base];
}

// Drop one token from a class string without disturbing the spacing that
// glues a template literal to the `${expression}` beside it.
function withoutToken(raw, token) {
  const hadLeading = /^\s/.test(raw);
  const hadTrailing = /\s$/.test(raw);
  let text = raw
    .split(/\s+/)
    .filter(Boolean)
    .filter((candidate) => candidate !== token)
    .join(' ');
  if (hadLeading) text = ` ${text}`;
  if (hadTrailing) text = `${text} `;
  return text;
}

function create(context) {
  const options = context.options[0] || {};
  const restrict = options.sharedClasses;
  const sourceCode = context.sourceCode || context.getSourceCode();
  // Keyed by carrier + token so a string carrying two dead utilities reports
  // twice, and the same token reached by two visitors reports once.
  const reportedKeys = new Set();

  function removeToken(fixer, carrier, token) {
    if (carrier.type === 'TemplateElement') {
      // espree's TemplateElement range includes the ` or }…${ delimiters, so
      // they are read back and re-emitted — otherwise the fix eats them.
      const full = sourceCode.getText(carrier);
      const lead = full.startsWith('`') ? '`' : full.startsWith('}') ? '}' : '';
      const trail = full.endsWith('`') ? '`' : full.endsWith('${') ? '${' : '';
      const raw = full.slice(lead.length, full.length - trail.length);
      return fixer.replaceTextRange(carrier.range, lead + withoutToken(raw, token) + trail);
    }
    // String literals carry their quotes in the source range; JSX className
    // values and plain `'az-glass …'` constants are both Literal nodes.
    return fixer.replaceTextRange(
      [carrier.range[0] + 1, carrier.range[1] - 1],
      withoutToken(sourceCode.getText(carrier).slice(1, -1), token)
    );
  }

  function check(entries) {
    const props = new Set();
    const agrees = new Set();
    const owners = [];
    for (const { token } of entries) {
      for (const name of sharedClassesIn(token)) {
        if (restrict && !restrict.includes(name)) continue;
        owners.push(name);
        for (const prop of SHARED_CLASSES[name]) props.add(prop);
        for (const equivalent of EQUIVALENT_TOKENS[name] || []) agrees.add(equivalent);
      }
    }
    if (props.size === 0) return;

    for (const { token, carrier } of entries) {
      if (sharedClassesIn(token).length > 0) continue;
      const base = stripVariants(token);
      if (!base || !/^[a-z[]/.test(base)) continue;
      if (agrees.has(token) || agrees.has(base)) continue;
      const property = base.startsWith('text-') ? textProperty(base) : null;
      const candidates = property ? [property] : [...props];

      for (const prop of candidates) {
        if (!props.has(prop)) continue;
        const matchers = Array.isArray(PROPERTY_MATCHERS[prop])
          ? PROPERTY_MATCHERS[prop]
          : [PROPERTY_MATCHERS[prop]];
        if (!matchers.some((re) => re.test(base))) continue;

        const key = `${carrier.range[0]}:${token}`;
        if (reportedKeys.has(key)) continue;
        reportedKeys.add(key);

        const owner = owners.find((name) => SHARED_CLASSES[name].includes(prop)) || owners[0];

        context.report({
          node: carrier,
          messageId: 'deadOverride',
          data: { token, owner, prop },
          fix: (fixer) => removeToken(fixer, carrier, token),
        });
        break;
      }
    }
  }

  function collect(value, entries) {
    if (!value) return;
    if (value.type === 'JSXExpressionContainer') {
      collect(value.expression, entries);
    } else if (value.type === 'Literal') {
      if (typeof value.value === 'string') {
        for (const token of value.value.split(/\s+/)) {
          if (token) entries.push({ token, carrier: value });
        }
      }
    } else if (value.type === 'TemplateLiteral') {
      for (const quasi of value.quasis) {
        for (const token of quasi.value.cooked.split(/\s+/)) {
          if (token) entries.push({ token, carrier: quasi });
        }
      }
      for (const expression of value.expressions) collect(expression, entries);
    } else if (value.type === 'ConditionalExpression') {
      collect(value.consequent, entries);
      collect(value.alternate, entries);
    } else if (value.type === 'LogicalExpression') {
      collect(value.right, entries);
    } else if (value.type === 'BinaryExpression' && value.operator === '+') {
      collect(value.left, entries);
      collect(value.right, entries);
    } else if (value.type === 'CallExpression') {
      // clsx / cn(...) / twMerge(...) receive the class list as arguments.
      for (const argument of value.arguments) collect(argument, entries);
    }
  }

  function isInsideClassNameAttribute(node) {
    let current = node.parent;
    while (current) {
      if (
        current.type === 'JSXAttribute' &&
        current.name &&
        /^(class|className|classList)$/.test(current.name.name)
      ) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  return {
    JSXAttribute(node) {
      if (!node.name || !['className', 'class', 'classList'].includes(node.name.name)) return;
      const entries = [];
      collect(node.value, entries);
      check(entries);
    },
    Literal(node) {
      if (typeof node.value !== 'string') return;
      // A className string was already analysed as part of its attribute, so
      // the union of shared classes and utilities is visible there.
      if (isInsideClassNameAttribute(node)) return;
      check(
        node.value
          .split(/\s+/)
          .filter(Boolean)
          .map((token) => ({ token, carrier: node }))
      );
    },
    TemplateLiteral(node) {
      if (isInsideClassNameAttribute(node)) return;
      const entries = [];
      collect(node, entries);
      check(entries);
    },
  };
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Tailwind utilities that can never win against an unlayered .az-* component class',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          sharedClasses: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
            description: 'Restrict the check to these shared component classes',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      deadOverride:
        "'{{token}}' cannot override '{{owner}}': globals.css is unlayered, so the shared class always wins over the '{{prop}}' utility. Drop '{{token}}', or compose the element from utilities without '{{owner}}'.",
    },
  },
  create,
};
