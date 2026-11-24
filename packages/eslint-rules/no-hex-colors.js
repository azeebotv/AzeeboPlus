/**
 * ESLint rule: no-hex-colors
 *
 * Prevents hardcoded hex colors in React Native StyleSheet.create() and inline style objects.
 * Encourages using design tokens from the theme system instead.
 *
 * Options:
 *   allowList: string[] - Hex colors to allow (e.g., ['#000000', '#FFFFFF'])
 *   allowTransparent: boolean - Allow 'transparent' keyword (default: true)
 *   retired: string[] - Hexes the brand has superseded. Reported even when the
 *     file also matches `retiredExemptPaths` — the ban is checked BEFORE the
 *     allow-list, so a retired color cannot hide inside `allowList`.
 *   retiredExemptPaths: string[] - Substrings of the (absolute) file path that
 *     are still migrating and may keep a retired hex.
 */

const HEX_COLOR_REGEX = /#[0-9A-Fa-f]{3,8}\b/g;
const STYLE_PROPERTIES = [
  'color',
  'backgroundColor',
  'borderColor',
  'borderTopColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderRightColor',
  'tintColor',
  'shadowColor',
  'textDecorationColor',
  'outlineColor',
  // Shorthands and SVG props that carry colors (gradients live here):
  'background',
  'backgroundImage',
  'fill',
  'stroke',
  'caretColor',
  'columnRuleColor',
];

function create(context) {
  const options = context.options[0] || {};
  const allowList = (options.allowList || []).map((c) => c.toLowerCase());
  const allowTransparent = options.allowTransparent !== false;
  // Superseded brand accents stay in the shared allowList only for the internal
  // consoles. The ban is checked BEFORE the allow-list and keyed on
  // context.filename, which is absolute — so it holds whether ESLint runs from
  // the repo root or from a workspace directory (the ratchet does the latter).
  const retired = (options.retired || []).map((c) => c.toLowerCase());
  const retiredExemptPaths = options.retiredExemptPaths || [];
  const filename = context.filename || context.getFilename();
  const retiredExempt = retiredExemptPaths.some((frag) => filename.includes(frag));
  // A literal inside StyleSheet.create matches BOTH the StyleSheet visitor
  // and the generic Literal visitor below — dedupe so each distinct hex at
  // each site reports exactly once (keyed by node position + hex, because a
  // single string like a gradient can carry several different hexes; the
  // ratchet counts rule warnings, so double reports would double every
  // floor). The position comes from node.range[0]: the typescript-eslint
  // parser does NOT populate node.start (a Babel/espree concept), so keying
  // on node.start silently collapsed every key to 'undefined:<hex>' and
  // reported each distinct hex only ONCE PER FILE — masking every duplicate
  // of a hex after its first occurrence. range[0] exists on every node.
  const reportedKeys = new Set();

  function isStyleSheetCreate(node) {
    return (
      node.callee &&
      node.callee.type === 'MemberExpression' &&
      node.callee.object.name === 'StyleSheet' &&
      node.callee.property.name === 'create'
    );
  }

  function isStyleObjectProperty(node) {
    return (
      node.parent &&
      node.parent.type === 'Property' &&
      node.parent.key &&
      STYLE_PROPERTIES.includes(node.parent.key.name || node.parent.key.value)
    );
  }

  function isWithinStyleObject(node) {
    let current = node;
    while (current) {
      if (
        current.type === 'ObjectExpression' &&
        current.parent &&
        current.parent.type === 'Property' &&
        current.parent.key &&
        (STYLE_PROPERTIES.includes(
          current.parent.key.name || current.parent.key.value,
        ) ||
          current.parent.key.name === 'style')
      ) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  function checkForHexColors(node, value) {
    if (typeof value !== 'string') return;

    const matches = value.match(HEX_COLOR_REGEX);
    if (!matches) return;

    for (const hex of matches) {
      const lowerHex = hex.toLowerCase();

      if (retired.includes(lowerHex) && !retiredExempt) {
        const reportKey = `${node.range[0]}:${lowerHex}`;
        if (reportedKeys.has(reportKey)) continue;
        reportedKeys.add(reportKey);
        context.report({
          node,
          messageId: 'retiredBrandAccent',
          data: { color: hex },
        });
        continue;
      }

      if (allowList.includes(lowerHex)) continue;

      const reportKey = `${node.range[0]}:${lowerHex}`;
      if (reportedKeys.has(reportKey)) continue;
      reportedKeys.add(reportKey);

      context.report({
        node,
        message:
          `Hardcoded hex color '${hex}' detected. ` +
          `Use a design token from the theme system instead (e.g., theme.colors.primary). ` +
          `Add to allowList option if this color is intentional.`,
      });
    }
  }

  function checkPropertyValue(node) {
    if (!isStyleObjectProperty(node) && !isWithinStyleObject(node)) return;

    if (node.type === 'Literal' && typeof node.value === 'string') {
      checkForHexColors(node, node.value);
    }

    if (node.type === 'TemplateLiteral') {
      for (const quasi of node.quasis) {
        checkForHexColors(node, quasi.value.cooked);
      }
    }
  }

  function checkStyleSheetBody(node) {
    const args = node.arguments;
    if (!args || args.length === 0) return;

    const stylesArg = args[0];
    if (stylesArg.type !== 'ObjectExpression') return;

    for (const prop of stylesArg.properties) {
      if (prop.type !== 'Property') continue;

      const value = prop.value;
      if (value.type !== 'ObjectExpression') continue;

      for (const styleProp of value.properties) {
        if (styleProp.type !== 'Property') continue;

        const styleValue = styleProp.value;
        if (
          styleValue.type === 'Literal' &&
          typeof styleValue.value === 'string'
        ) {
          checkForHexColors(styleValue, styleValue.value);
        }

        if (styleValue.type === 'TemplateLiteral') {
          for (const quasi of styleValue.quasis) {
            checkForHexColors(styleValue, quasi.value.cooked);
          }
        }
      }
    }
  }

  return {
    CallExpression(node) {
      if (isStyleSheetCreate(node)) {
        checkStyleSheetBody(node);
      }
    },
    Literal: checkPropertyValue,
    TemplateLiteral: checkPropertyValue,
  };
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow hardcoded hex colors in React Native StyleSheet and inline styles',
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
            description: 'Hex colors to allow (e.g., ["#000000"])',
          },
          allowTransparent: {
            type: 'boolean',
            description: 'Allow the "transparent" keyword',
            default: true,
          },
          retired: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
            description: 'Superseded brand accents — reported even when allowListed',
          },
          retiredExemptPaths: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
            description: 'Path fragments whose files may still use retired accents',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noHexColor:
        "Hardcoded hex color '{{color}}' detected. Use a design token instead.",
      retiredBrandAccent:
        "'{{color}}' is a retired brand accent. Use #E31E24 (scarlet) or #EC691F (flame) " +
        "from the design tokens instead — the old pair is gone from the public surfaces.",
    },
  },
  create,
};
