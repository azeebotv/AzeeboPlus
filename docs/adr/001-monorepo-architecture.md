# ADR-001: Monorepo Architecture

## Status

Accepted

## Context

The Azeebo+ platform consists of multiple services, frontend applications, and shared packages. We needed to decide on the repository structure to maximize code reuse, simplify dependency management, and enable consistent tooling.

## Decision

We will use a monorepo architecture with pnpm workspaces.

### Structure

```
azeebo-plus/
├── apps/
│   ├── web/          # Next.js 15 web application
│   ├── admin/        # Vite + React admin panel
│   ├── creator/      # Vite + React creator dashboard
│   └── mobile/       # React Native/Expo mobile app
├── services/
│   ├── core/         # Core services (auth, user, wallet, etc.)
│   ├── engagement/   # Engagement services (notification, reward, etc.)
│   ├── intelligence/ # Intelligence services (analytics, recommendation)
│   ├── operations/   # Operations services (moderation, queue, support)
│   └── universes/    # Universe services (reality, movie, comedy, etc.)
├── packages/
│   ├── shared-types/ # TypeScript type definitions
│   ├── api-client/   # API client library
│   ├── security/     # Security utilities
│   └── ...           # Other shared packages
└── docker/           # Docker configurations
```

### Tooling

- **Package Manager:** pnpm with workspaces
- **Build System:** TypeScript + Vite/Next.js
- **Testing:** Vitest + Playwright
- **Linting:** ESLint + Prettier
- **CI/CD:** GitHub Actions

## Consequences

### Positive

- Code reuse across services and apps
- Consistent tooling and configuration
- Simplified dependency management
- Atomic commits across related changes
- Better developer experience

### Negative

- Larger repository size
- More complex CI/CD setup
- Requires careful dependency management
- Potential for tighter coupling

## Alternatives Considered

1. **Polyrepo:** Separate repositories for each service
   - Rejected due to code duplication and sync issues

2. **Multi-package repo:** Multiple packages in one repo without workspaces
   - Rejected due to lack of dependency hoisting and linking

## References

- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [Monorepo Best Practices](https://www円nxlabs.com/blog/monorepos)
