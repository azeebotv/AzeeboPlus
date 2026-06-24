# @azeebo/design-tokens

Shared design tokens for Azeebo+ applications.

## Features

- **Color Palette**: Brand colors and themes
- **Typography**: Font sizes, weights, and styles
- **Spacing**: Consistent spacing values
- **Breakpoints**: Responsive breakpoints

## Usage

```typescript
import { colors, spacing, breakpoints } from '@azeebo/design-tokens';

const styles = {
  color: colors.primary,
  padding: spacing.md,
  [breakpoints.md]: {
    padding: spacing.lg,
  },
};
```

## Ownership

- **Team**: Design Engineering
- **Maintainer**: design@azeeboplus.com
- **Last Updated**: 2026-05-11