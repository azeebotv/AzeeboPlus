/**
 * ESLint rule: require-shared-route-boundary
 *
 * `apps/web/src/app/**\/error.tsx` and `loading.tsx` are not app code — they are
 * the two states every route renders before the route exists. They were
 * generated per folder, so 219 error boundaries and 217 loading boundaries each
 * drew their own card and their own spinner, which is how one retired accent
 * alias reached ~200 files and why the same product spun three different ways
 * depending on who scaffolded the directory.
 *
 * They now all render `RouteErrorFallback` / `RouteLoading`. This rule keeps
 * that true for the next route instead of relying on whoever writes it having
 * read this comment: a new boundary gets the shared component or it gets an
 * explicit escape marker, so the exception is visible in review.
 *
 * `global-error.tsx` is exempt by name: Next.js bypasses the root layout there
 * and the page must render its own `<html>`/`<body>`, so it styles with inline
 * token values on purpose.
 *
 * Options:
 *   boundaries:   Record<string, string> - file name -> required module specifier
 *   escapeMarker: string                 - comment that opts a file out
 *   rootFragment: string                 - path fragment scoping the rule to the router tree
 */

const DEFAULTS = {
  boundaries: {
    'error.tsx': '@/components/ui/RouteErrorFallback',
    'loading.tsx': '@/components/ui/RouteLoading',
  },
  exemptFileNames: ['global-error.tsx'],
  escapeMarker: 'design-system:custom-boundary',
  rootFragment: '/src/app/',
};

function create(context) {
  const options = context.options[0] || {};
  const boundaries = { ...DEFAULTS.boundaries, ...(options.boundaries || {}) };
  const exempt = options.exemptFileNames || DEFAULTS.exemptFileNames;
  const escapeMarker = options.escapeMarker || DEFAULTS.escapeMarker;
  const rootFragment = options.rootFragment || DEFAULTS.rootFragment;
  const filename = context.filename || context.getFilename();

  const basename = filename.split('/').pop();
  const required = boundaries[basename];
  if (!required) return {};
  if (exempt.includes(basename)) return {};
  // Only inside the App Router tree; `src/components/ui/error.tsx` is a
  // component, not a boundary.
  if (!filename.includes(rootFragment)) return {};

  const sourceCode = context.sourceCode || context.getSourceCode();

  return {
    Program(node) {
      const imports = node.body
        .filter((statement) => statement.type === 'ImportDeclaration')
        .map((statement) => String(statement.source.value));
      if (imports.some((spec) => spec.endsWith(required.split('/').pop()))) return;

      const commented = sourceCode
        .getAllComments()
        .some((comment) => comment.value.includes(escapeMarker));
      if (commented) return;

      context.report({
        node,
        loc: { line: 1, column: 0 },
        messageId: 'missingSharedBoundary',
        data: { basename, required, escapeMarker },
      });
    },
  };
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require app-router error and loading boundaries to render the shared RouteErrorFallback / RouteLoading',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    messages: {
      missingSharedBoundary:
        "'{{basename}}' must render the shared boundary state ('{{required}}'). Every route's error and pending state is one design-system surface, not a per-folder drawing. If this boundary genuinely needs its own treatment, add a `// {{escapeMarker}} <reason>` comment so the exception stays reviewable.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          boundaries: {
            type: 'object',
            additionalProperties: { type: 'string' },
            description: 'Boundary file name -> required shared component module',
          },
          exemptFileNames: { type: 'array', items: { type: 'string' } },
          escapeMarker: { type: 'string' },
          rootFragment: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  create,
};
