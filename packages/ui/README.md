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
- **Maintainer**: frontend@azeebo.com
- **Last Updated**: 2026-05-11