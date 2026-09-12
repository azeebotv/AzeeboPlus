/**
 * ESLint rule: require-map-and-throw
 *
 * Bans hardcoded 4xx `throw new <HttpException>` inside catch blocks. When a
 * catch block fabricates a client-error status, the real cause (a Prisma
 * P2xxx code, an upstream 4xx/5xx, a network failure) is flattened into one
 * hardcoded status — the exact pattern that turned a database outage into a
 * 400 "Bad Request" on /users/me/preferences.
 *
 * The required replacement is `mapAndThrow(error, '<context>')` from
 * `@azeebo/security`, which preserves HttpExceptions, maps Prisma/upstream/
 * network error classes to their matching statuses, and defaults to 500 for
 * unknown failures (never lies about a 4xx).
 *
 * What is flagged:
 *   - `throw new NotFoundException(...)` / BadRequest / Unauthorized /
 *     Forbidden / Conflict / PayloadTooLarge / RequestTimeout / Unprocessable /
 *     TooManyRequests / NotAcceptable / Gone / UnsupportedMediaType, and the
 *     generic `throw new HttpException('...', 4xx)` — when thrown lexically
 *     inside a catch block whose exception is "in flight" (not rethrown
 *     unchanged). `throw error;` rethrows are NOT flagged (preserving the
 *     original error is correct).
 *   - Plain `Error`/`TypeError`/... throws in catch blocks are NOT flagged by
 *     default (they yield 500, which is at least truthful); pass
 *     `{ banPlainErrors: true }` to include them.
 *
 * What is NOT flagged:
 *   - throws outside any catch block (validation DTOs, guards, constructors)
 *   - rethrows of the caught error itself (`throw error`)
 *   - `mapAndThrow(error, ...)` calls (the required form)
 *   - catch blocks that don't use the caught error's identity to decide
 *     behavior are still flagged — the rule is syntactic by design.
 *
 * Suppression escape hatch: a leading `// allowed-fabricated-4xx` comment
 * inside the catch block, or a standard eslint-disable line.
 */

const HTTP_EXCEPTION_CLASSES_4XX = new Set([
  'BadRequestException',
  'UnauthorizedException',
  'PaymentRequiredException',
  'ForbiddenException',
  'NotFoundException',
  'MethodNotAllowedException',
  'NotAcceptableException',
  'RequestTimeoutException',
  'ConflictException',
  'GoneException',
  'PayloadTooLargeException',
  'UnsupportedMediaTypeException',
  'UnprocessableEntityException',
  'TooManyRequestsException',
]);

const PLAIN_ERROR_CLASSES = new Set([
  'Error',
  'TypeError',
  'RangeError',
  'SyntaxError',
  'EvalError',
  'URIError',
  'AggregateError',
]);

// Status codes >= 400 and < 500 (HttpException's numeric status form).
function isHardcoded4xxStatus(literalNode) {
  return typeof literalNode.value === 'number' && literalNode.value >= 400 && literalNode.value < 500;
}

function getThrownCtorName(node) {
  if (node.type !== 'ThrowStatement' || !node.argument) return null;
  if (node.argument.type !== 'NewExpression') return null;
  const callee = node.argument.callee;
  return callee && callee.type === 'Identifier' ? callee.name : null;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require mapAndThrow from @azeebo/security instead of hardcoded 4xx throws inside catch blocks',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [
      {
        type: 'object',
        properties: {
          banPlainErrors: { type: 'boolean', default: false },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      hardcoded4xx:
        "Do not fabricate a hardcoded 4xx inside a catch block — the real cause may need a different status. Use `mapAndThrow({{errorName}}, '<context>')` from @azeebo/security, which rethrows HttpExceptions unchanged and maps Prisma/upstream/network errors correctly.",
      hardcoded4xxNoVar:
        "Do not fabricate a hardcoded 4xx inside a catch block — the real cause may need a different status. Use `mapAndThrow(error, '<context>')` from @azeebo/security, which rethrows HttpExceptions unchanged and maps Prisma/upstream/network errors correctly.",
      plainError:
        'Throwing {{name}} inside a catch block yields a generic 500 and loses the cause. Use `mapAndThrow({{errorName}}, \'<context>\')` from @azeebo/security instead.',
    },
  },

  create(context) {
    const options = context.options[0] ?? {};
    const banPlainErrors = options.banPlainErrors === true;
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    // Map: CatchClause node -> parameter name (e.g. 'error'), if it has one.
    function caughtParamName(catchClause) {
      if (!catchClause.param || catchClause.param.type !== 'Identifier') return null;
      return catchClause.param.name;
    }

    function hasSuppressionComment(catchClause) {
      // A leading `// allowed-fabricated-4xx` comment anywhere inside the block.
      const comments = sourceCode.getAllComments();
      return comments.some(
        (c) =>
          c.range[0] >= catchClause.range[0] &&
          c.range[1] <= catchClause.range[1] &&
          /allowed-fabricated-4xx/.test(c.value)
      );
    }

    function isRethrowOfCaughtParam(throwStmt, paramName) {
      if (!paramName) return false;
      return (
        throwStmt.argument.type === 'Identifier' && throwStmt.argument.name === paramName
      );
    }

    function report(throwStmt, messageId, data) {
      context.report({ node: throwStmt, messageId, data });
    }

    return {
      CatchClause(node) {
        const paramName = caughtParamName(node);
        const body = node.body;
        if (!body) return;

        if (hasSuppressionComment(node)) return;

        const throwStatements = [];
        const stack = [body];
        while (stack.length) {
          const current = stack.pop();
          if (!current || typeof current !== 'object') continue;
          if (current.type === 'ThrowStatement') throwStatements.push(current);
          for (const key of Object.keys(current)) {
            if (key === 'parent' || key === 'range' || key === 'loc') continue;
            const value = current[key];
            if (Array.isArray(value)) {
              for (const v of value) {
                if (v && typeof v === 'object' && v.type) stack.push(v);
              }
            } else if (value && typeof value === 'object' && value.type && value !== node) {
              stack.push(value);
            }
          }
        }

        for (const throwStmt of throwStatements) {
          // Rethrowing the caught error unchanged is always correct.
          if (isRethrowOfCaughtParam(throwStmt, paramName)) continue;

          const ctorName = getThrownCtorName(throwStmt);
          if (!ctorName) continue;

          if (HTTP_EXCEPTION_CLASSES_4XX.has(ctorName)) {
            report(
              throwStmt,
              paramName ? 'hardcoded4xx' : 'hardcoded4xxNoVar',
              { errorName: paramName ?? 'error' }
            );
            continue;
          }

          if (ctorName === 'HttpException') {
            const args = throwStmt.argument.arguments ?? [];
            const statusArg = args[args.length - 1];
            if (
              statusArg &&
              (statusArg.type === 'Literal' || statusArg.type === 'NumericLiteral') &&
              isHardcoded4xxStatus(statusArg)
            ) {
              report(throwStmt, paramName ? 'hardcoded4xx' : 'hardcoded4xxNoVar', {
                errorName: paramName ?? 'error',
              });
            }
            continue;
          }

          if (banPlainErrors && PLAIN_ERROR_CLASSES.has(ctorName)) {
            report(throwStmt, 'plainError', { name: ctorName, errorName: paramName ?? 'error' });
          }
        }
      },
    };
  },
};
