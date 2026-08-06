# @azeebo/auth

Auth components for Azeebo+ — React context and hooks for authentication state.

## Features

- `AuthProvider` — React context for auth state management
- `useAuth` — Hook for login, logout, registration, password reset
- JWT token storage and refresh
- Biometric authentication support (native)

## Usage

```tsx
import { AuthProvider, useAuth } from '@azeebo/auth';

function App() {
  return (
    <AuthProvider>
      <MyComponent />
    </AuthProvider>
  );
}

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();
  // ...
}
```

## Exports

| Export | Description |
|--------|-------------|
| `AuthProvider` | Context provider wrapping auth state |
| `useAuth` | Hook returning auth state and methods |
| `AuthContext` | Raw context (advanced usage) |
