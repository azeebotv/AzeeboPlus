# Skill: Share Component

> Move a component to the shared UI package for reuse across apps.

---

## Usage

```
/share-component [component-path] [target-package]

Examples:
/share-component apps/mobile/src/components/VoteButton.tsx ui
/share-component apps/web/src/components/HeroCard.tsx ui
/share-component apps/mobile/src/utils/formatDate.ts utils
```

## What It Does

1. Reads the component code
2. Removes app-specific dependencies
3. Moves to `/packages/[target-package]/src`
4. Exports from package index
5. Updates all imports across apps
6. Runs type check to verify

## Target Packages

| Package | Purpose |
|---------|---------|
| `ui` | React components, buttons, cards, modals |
| `utils` | Utility functions (date, string, number) |
| `validation` | Zod/Yup schemas |
| `error-handling` | Custom error classes |
| `types` | TypeScript type definitions |

## Template: Shared Component

```typescript
// packages/ui/src/components/VoteButton/VoteButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface VoteButtonProps {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
}

export function VoteButton({ onPress, disabled, label = 'Vote' }: VoteButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
```

## Template: Package Index Export

```typescript
// packages/ui/src/index.ts
export { VoteButton } from './components/VoteButton/VoteButton';
```

## Rules

- Remove all app-specific imports (navigation, analytics, etc.)
- Use design tokens from `/packages/design-tokens`
- Keep components pure (no side effects)
- Add TypeScript interfaces for props
- Export from package index
- Update all imports atomically
