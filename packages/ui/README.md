# @azeebo/ui

Shared UI components and hooks for Azeebo+ applications.

## Features

- **Web Components**: Reusable React components for web
- **Mobile Components**: Reusable React Native components
- **Hooks**: Shared hooks for state management and API interactions

## Usage

```typescript
import { Button, useApi } from '@azeebo/ui';

// Web components
<Button variant="primary">Click me</Button>

// Custom hooks
const { data, loading, error } = useApi('/api/data');
```

## Ownership

- **Team**: Frontend Engineering
- **Maintainer**: frontend@azeeboplus.com
- **Last Updated**: 2026-05-11

## Storybook

Component playground and living style guide. Stories live next to their
components in `src/**/*.stories.tsx`.

```bash
# Interactive dev server on http://localhost:6006 (from packages/ui)
pnpm storybook

# Regenerate the static build into storybook-static/
pnpm build-storybook
```

From the repo root, scope either command with `pnpm --filter @azeebo/ui ...`.

The `storybook-static/` output directory is a build artifact: it is
**gitignored** and not published anywhere, so regenerate it locally with
`build-storybook` whenever you need to browse the latest components. Delete it
freely — it is fully reproducible from source.