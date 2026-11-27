/**
 * ESLint rule: no-arbitrary-hex-class
 *
 * `no-hex-colors` only inspects style *positions* (StyleSheet.create and inline
 * style objects), so a Tailwind arbitrary value like `bg-[#0b090e]` inside a
 * className string is invisible to it. This rule closes that half: any
 * arbitrary-value token carrying a raw hex is reported, wherever the string
 * lives — className literals, clsx/cn arguments, ternary branches.
 *
 * The replacement is the generated token layer: `bg-az-scarlet`, `text-az-ink`,
 * or `bg-[image:var(--gradient-az-cta)]` for gradients.
 *
 * Options:
 *   allowList: string[] - hex values permitted as arbitrary values
 */

const ARBITRARY_HEX_VALUE = /[a-z-]+-\[#[0-9A-Fa-f]{3,8}\]/gi;
const ARBITRARY_PROPERTY_HEX = /\[[\w-]+:\s*#[0-9A-Fa-f]{3,8}\]/gi;

function extractHexes(text) {
  const found = [];
  for (const re of [ARBITRARY_HEX_VALUE, ARBITRARY_PROPERTY_HEX]) {
    for (const match of text.matchAll(re)) {
      const hex = /#([0-9A-Fa-f]{3,8})/.exec(match[0]);
      if (hex) found.push(hex[1]);
    }
  }
  return found;
}

function create(context) {
  const options = context.options[0] || {};
  const allowList = (options.allowList || []).map((c) => c.toLowerCase().replace(/^#/, ''));
  // Keyed by node position + hex so a string carrying two distinct hexes
  // reports twice, and the same node visited by two visitors reports once
  // (see no-hex-colors for the range[0] rationale).
  const reportedKeys = new Set();

  function check(node, value) {
    if (typeof value !== 'string') return;

    for (const hex of extractHexes(value)) {
      const lower = hex.toLowerCase();
      if (allowList.includes(lower)) continue;

      const key = `${node.range[0]}:${lower}`;
      if (reportedKeys.has(key)) continue;
      reportedKeys.add(key);

      context.report({
        node,
        messageId: 'noArbitraryHex',
        data: { color: `#${hex}` },
      });
    }
  }

  return {
    Literal(node) {
      if (typeof node.value === 'string') check(node, node.value);
    },
    TemplateLiteral(node) {
      for (const quasi of node.quasis) check(node, quasi.value.cooked);
    },
  };
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow raw hex colors in Tailwind arbitrary values; use the generated az-* token utilities',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowList: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
            description: 'Hex values allowed as arbitrary values (e.g. ["#FFFFFF"])',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noArbitraryHex:
        "Raw hex '{{color}}' in a Tailwind arbitrary value. Use a generated token utility (bg-az-scarlet, text-az-ink) or var(--color-az-*) instead.",
    },
  },
  create,
};
