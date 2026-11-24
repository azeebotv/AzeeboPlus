/**
 * ESLint rule: no-console-log
 *
 * Bans `console.log` calls in production code so logs don't leak to stdout /
 * end users. `console.error`/`console.warn` and other severity levels are
 * allowed (they belong in structured loggers too, but the critical misuse is
 * accidental debug logging). A preceding comment `// eslint-disable-next-line no-console-log`
 * remains the documented escape hatch.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow console.log statements in production code',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [],
    messages: {
      unexpected: 'Unexpected console.log statement. Use the structured logger instead.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee &&
          node.callee.type === 'MemberExpression' &&
          node.callee.object &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'console' &&
          node.callee.property &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'log'
        ) {
          context.report({
            node,
            messageId: 'unexpected',
          });
        }
      },
    };
  },
};
