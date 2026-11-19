/**
 * ESLint rule: no-low-contrast-pair
 *
 * One rule for every light fill in the system. A solid fill whose white ink
 * falls under WCAG 2.2 AA's 4.5:1 body-text floor is a table entry in
 * `contrast-pairs.json`, not a new rule: the measured colours live in data, the
 * ratio is computed from them, and the deep ink that fixes the pairing comes
 * from the same table. A table entry names a design token, so both spellings a
 * page can write — `bg-az-flame` and `bg-[var(--color-az-flame)]` — come for
 * free and neither can be forgotten.
 *
 * Why this exists at all: the pairing is invisible to every other gate. Both
 * classes are real tokens, the CSS compiles, `no-off-system-color-utility` and
 * `no-undefined-az-utility` have nothing to say, and code review sees one
 * correct-looking chip. It only fails where a browser measures it — how the
 * 2026-11-10/11 sweep found white-on-flame on 152 of 177 pages, and why
 * `bg-az-warning-500 text-az-ink` (2.15:1) survived on the dual-control step
 * marker while its flame sibling was being fixed. `scripts/visual-audit.mjs`
 * catches what ships; this rule catches the markup before it gets there.
 *
 * The table is deliberately narrow about what counts as a surface:
 *   • solid fills only. A translucent wash (`bg-az-flame/10`) sits on the dark
 *     canvas and keeps the light ink — that is the pattern, not a defect.
 *   • gradients are NOT flagged. Whether a label passes on `from-az-flame
 *     to-az-scarlet` depends on the stop under each glyph and on the label's
 *     computed size, neither of which a class list resolves. The rendered audit
 *     measures the actual stops.
 *   • a class list that also names a deep ink is left alone: the author has
 *     already paired the fill with dark ink, and both inks present is a cascade
 *     question (`no-dead-class-override`), not a legibility one.
 *   • large-text roles are exempt — the rule's floor drops to the table's
 *     `largeText` threshold for them. The audit verifies the real computed size
 *     rather than trusting a role name.
 *
 * Options:
 *   tablePath:        string  - JSON table to read instead of `contrast-pairs.json`
 *   ignoreLargeText:  boolean - default true; false enforces body-text ratios
 *                               even on large-text roles
 */

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_TABLE_PATH = path.join(__dirname, 'contrast-pairs.json');

/**
 * Large-text roles: at 24px, or 18.66px bold, AA's floor is 3:1 rather than
 * 4.5:1. These roles are at or above that size in the generated type scale
 * (docs/design/design-system-tokens-spec.md).
 */
const LARGE_TEXT_ROLES =
  /^(?:az-(?:title|subtitle|section-title|heading|hero-title|headline|display)|text-(?:2|3|4|5|6|7|8|9)xl|text-\[\d{2,}px\])$/;

/**
 * Variants that paint a different box than the element itself. Base ink is not
 * painted inside `::file-selector-button`, and `placeholder:`/`selection:` text
 * is the only copy that lives there — so a fill behind one of these only pairs
 * with ink that carries the same variant.
 */
const PSEUDO_VARIANTS = new Set([
  'file',
  'placeholder',
  'before',
  'after',
  'selection',
  'marker',
  'first-letter',
  'first-line',
  'backdrop',
]);

/** `#rgb` / `#rrggbb` → 0–255 channel triple. */
function parseHex(hex) {
  if (typeof hex !== 'string') return null;
  let value = hex.trim().replace(/^#/, '');
  if (value.length === 3) value = value.replace(/./g, (char) => char + char);
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
}

/** WCAG 2.2 relative luminance of an sRGB colour. */
function relativeLuminance(hex) {
  const channels = parseHex(hex);
  if (!channels) throw new Error(`contrast-pairs: '${hex}' is not a hex colour`);
  const [r, g, b] = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.2 contrast ratio, rounded to two decimals (1–21). */
function contrastRatio(a, b) {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (left, right) => right - left
  );
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

const tableCache = new Map();

function loadTable(tablePath) {
  const resolved = path.resolve(tablePath);
  if (tableCache.has(resolved)) return tableCache.get(resolved);
  const table = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  tableCache.set(resolved, table);
  return table;
}

/** Every utility that names this family, plus an optional opacity modifier. */
function splitVariants(token) {
  const variants = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < token.length; index += 1) {
    const char = token[index];
    if (char === '[') depth += 1;
    else if (char === ']') depth = Math.max(0, depth - 1);
    else if (char === ':' && depth === 0) {
      variants.push(token.slice(start, index));
      start = index + 1;
    }
  }
  return { variants, utility: token.slice(start) };
}

/** `bg-az-flame/15` is a translucent wash, not a solid surface. */
function isTranslucent(utility) {
  const match = utility.match(/\/(\d{1,3})$/);
  return Boolean(match) && Number(match[1]) < 100;
}

/** `text-az-ink/70` is still the white ink family, at 70% opacity. */
function matchesFamily(utility, families) {
  return families.some((family) => utility === family || utility.startsWith(`${family}/`));
}

function isSubset(smaller, larger) {
  return [...smaller].every((variant) => larger.has(variant));
}

function create(context) {
  const options = context.options[0] || {};
  const table = loadTable(options.tablePath || DEFAULT_TABLE_PATH);
  const ignoreLargeText = options.ignoreLargeText !== false;
  const bodyFloor = table.thresholds.bodyText;
  const largeFloor = table.thresholds.largeText;

  const lightInks = table.inks.light.map((ink) => ({
    ...ink,
    families: [ink.utility],
  }));
  const lightFamilies = lightInks.flatMap((ink) => ink.families);
  const deepInkFamilies = table.inks.deep.flatMap((ink) => [ink.utility]);

  // The fill's preferred ink: the first deep ink in table order that clears the
  // floor, so the suggestion is a design token (`text-az-surface-root`) rather
  // than whichever black happens to measure highest, and it is measured rather
  // than asserted.
  const surfaces = table.surfaces.map(({ token, color }) => {
    // Both spellings a page can write for one token; a new entry gets them for
    // free, so the arbitrary-value form can never be forgotten.
    const surface = {
      token,
      color,
      utilities: [`bg-az-${token}`, `bg-[var(--color-az-${token})]`],
    };
    const measured = lightInks.map((ink) => ({
      ink,
      ratio: contrastRatio(ink.color, surface.color),
    }));
    const alternatives = table.inks.deep.map((ink) => ({
      ...ink,
      ratio: contrastRatio(ink.color, surface.color),
    }));
    const fallback = [...alternatives].sort((left, right) => right.ratio - left.ratio)[0];
    return {
      ...surface,
      measured,
      enforced: measured.some((entry) => entry.ratio < bodyFloor),
      alternatives,
      fallback,
    };
  });

  const reportedKeys = new Set();

  /**
   * Analyses one class list (a whole `className` value, or a standalone string
   * constant such as a shared style object).
   */
  function check(entries) {
    const inks = [];
    const fills = [];
    const deepInk = [];
    let largeText = false;

    for (const { token, carrier } of entries) {
      const { variants, utility } = splitVariants(token);
      if (!utility || utility === '!') continue;
      const bare = utility.replace(/^!/, '');
      if (LARGE_TEXT_ROLES.test(bare)) largeText = true;
      if (matchesFamily(bare, deepInkFamilies)) {
        deepInk.push({ variants: new Set(variants) });
        continue;
      }
      if (matchesFamily(bare, lightFamilies)) {
        inks.push({ token, utility: bare, variants: new Set(variants), carrier });
        continue;
      }
      for (const surface of surfaces) {
        if (!surface.enforced) continue;
        if (!matchesFamily(bare, surface.utilities)) continue;
        if (isTranslucent(bare)) continue;
        fills.push({ token, utility: bare, variants: new Set(variants), surface });
        break;
      }
    }

    if (inks.length === 0 || fills.length === 0) return;

    for (const ink of inks) {
      for (const fill of fills) {
        // Two tokens co-apply when one variant set contains the other: the base
        // state (`''`) applies under every variant, and `hover:` matches
        // `hover:` exactly. `hover:` against `focus:` can co-exist in theory but
        // is too speculative to report.
        const pseudo = [...fill.variants].some((variant) => PSEUDO_VARIANTS.has(variant));
        const coApplies = pseudo
          ? isSubset(fill.variants, ink.variants)
          : isSubset(ink.variants, fill.variants) || isSubset(fill.variants, ink.variants);
        if (!coApplies) continue;

        // The author already reached for deep ink in this state — either the
        // pairing is corrected or the cascade decides, and neither is this
        // rule's finding.
        if (
          deepInk.some(
            (dark) => isSubset(dark.variants, ink.variants) || isSubset(ink.variants, dark.variants)
          )
        ) {
          continue;
        }

        // `text-az-ink/70` is the same ink at 70% opacity, so the measurement is
        // the family's; a translucent ink is never better than opaque white.
        const inkBase = ink.utility.replace(/\/\d{1,3}$/, '');
        const measured = fill.surface.measured.find((entry) => entry.ink.utility === inkBase);
        // The table may list the fill as measured-but-passing (bg-az-scarlet at
        // 4.69:1); only a pairing under the applicable floor is a finding.
        if (!measured) continue;
        const floor = ignoreLargeText && largeText ? largeFloor : bodyFloor;
        if (measured.ratio >= floor) continue;

        const alternative =
          fill.surface.alternatives.find((entry) => entry.ratio >= floor) || fill.surface.fallback;
        const key = `${ink.carrier.range[0]}:${ink.utility}:${fill.utility}`;
        if (reportedKeys.has(key)) continue;
        reportedKeys.add(key);

        context.report({
          node: ink.carrier,
          messageId: 'lowContrast',
          data: {
            ink: ink.token,
            surface: fill.token,
            ratio: measured.ratio.toFixed(2),
            floor: String(floor),
            alternative: alternative.utility,
            alternativeRatio: alternative.ratio.toFixed(2),
          },
        });
      }
    }
  }

  function tokenize(text, carrier) {
    return text
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => ({ token, carrier }));
  }

  /**
   * Merge class lists into every combination — `('a', on && 'b')` produces
   * `a b` and `a`, which are the lists actually rendered.
   */
  function product(lists) {
    let combined = [[]];
    for (const list of lists) {
      const next = [];
      for (const left of combined) for (const right of list) next.push([...left, ...right]);
      combined = next;
      // A class expression with a dozen ternaries would be 2^12 lists; the
      // first few dozen cover what a page can realistically write.
      if (combined.length >= 64) break;
    }
    return combined;
  }

  /**
   * Every class list this expression can render, one array per alternative.
   *
   * Branches are kept apart on purpose. A tab that is `bg-flame text-az-ink`
   * when active and `text-az-ink/60` when idle renders light-on-flame in one
   * state only; merging the branches would also accuse the idle label of a
   * pairing it never has — and "fix" the wrong branch to dark ink on the dark
   * glass panel. Static classes around a conditional (the template quasis) are
   * present in every alternative, which is what makes the common
   * `className={`… text-az-ink ${active ? 'bg-flame' : 'bg-glass'}`}` shape
   * catchable.
   */
  function alternatives(value) {
    if (!value) return [[]];
    switch (value.type) {
      case 'JSXExpressionContainer':
        return alternatives(value.expression);
      case 'Literal':
        return typeof value.value === 'string' ? [tokenize(value.value, value)] : [[]];
      case 'TemplateLiteral': {
        const base = value.quasis.flatMap((quasi) => tokenize(quasi.value.cooked, quasi));
        const branches = value.expressions.map(alternatives);
        return product(branches).map((extra) => [...base, ...extra]);
      }
      case 'ConditionalExpression':
        return [...alternatives(value.consequent), ...alternatives(value.alternate)];
      case 'LogicalExpression':
        // `cond && 'bg-az-flame'` renders either with or without the classes.
        return [...alternatives(value.right), []];
      case 'BinaryExpression':
        if (value.operator !== '+') return [[]];
        return product([alternatives(value.left), alternatives(value.right)]);
      case 'CallExpression':
        // clsx / cn(...) / twMerge(...) receive the class list as arguments.
        return product(value.arguments.map(alternatives));
      default:
        // Identifiers, member expressions and calls into unknown helpers: the
        // class list is not visible here, so nothing can be concluded.
        return [[]];
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
      for (const entries of alternatives(node.value)) check(entries);
    },
    Literal(node) {
      if (typeof node.value !== 'string') return;
      // A className string was already analysed as part of its attribute.
      if (isInsideClassNameAttribute(node)) return;
      check(tokenize(node.value, node));
    },
    TemplateLiteral(node) {
      if (isInsideClassNameAttribute(node)) return;
      for (const entries of alternatives(node)) check(entries);
    },
  };
}

module.exports = {
  // Exposed for scripts/__tests__ and the stylesheet-sync test: the ratio must
  // be computed from the table's hexes, never hand-typed.
  contrastRatio,
  relativeLuminance,
  parseHex,
  loadTable,
  DEFAULT_TABLE_PATH,
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow light ink on a solid light fill whose measured contrast is below WCAG 2.2 AA',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [
      {
        type: 'object',
        properties: {
          tablePath: { type: 'string' },
          ignoreLargeText: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      lowContrast:
        "'{{ink}}' on '{{surface}}' measures {{ratio}}:1, below WCAG AA's {{floor}}:1 floor. Use '{{alternative}}' ({{alternativeRatio}}:1) on this fill, or move the label to a darker surface / large text.",
    },
  },
  create,
};
