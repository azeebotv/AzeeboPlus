# @azeebo/eslint-rules

Custom ESLint rules for Azeebo+ code quality enforcement.

## Rules

| Rule | Description |
|------|-------------|
| `no-hardcoded-colors` | Enforces use of theme tokens instead of hex colors |
| `require-accessibility-labels` | Enforces accessibilityLabel on interactive elements |
| `no-console-in-production` | Prevents console.log in production code |
| `enforce-i18n` | Enforces useTranslation hook for user-facing strings |

## Usage

```json
{
  "extends": ["@azeebo/eslint-rules"]
}
```
