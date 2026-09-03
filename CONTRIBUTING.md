# Contributing to Azeebo+

Thank you for your interest in contributing to Azeebo+! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Redis 7+

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/azeebo-plus.git
   cd azeebo-plus
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment:
   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

4. Start services:
   ```bash
   ./start-all.sh
   ```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

### Commit Messages

Use conventional commits:
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `refactor: improve code structure`

### Pull Requests

1. Create a feature branch
2. Make your changes
3. Run tests: `pnpm test`
4. Run linting: `pnpm lint`
5. Submit a pull request

## Code Style

### TypeScript

- Use strict TypeScript
- Avoid `any` types
- Use interfaces for object shapes
- Prefer `const` over `let`

### React

- Use functional components
- Use hooks for state and effects
- Keep components small and focused
- Use proper prop types

### CSS

- Use CSS variables for colors
- Follow the design system
- Use Tailwind CSS classes
- Avoid inline styles when possible

## Testing

### Unit Tests

```bash
cd apps/web && npx vitest run
```

### Integration Tests

```bash
cd services/<service> && npm run test
```

### E2E Tests

```bash
cd apps/web && npx playwright test
```

## Documentation

- Update README.md for major changes
- Add JSDoc comments for public APIs
- Update inline code comments
- Create architecture decision records (ADRs) for significant decisions

## Code Review

### Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] No console.log in production code
- [ ] Proper error handling
- [ ] Accessibility considerations
- [ ] Performance implications reviewed

### Feedback

- Be constructive and respectful
- Focus on the code, not the person
- Suggest improvements, not just problems
- Ask questions if unsure

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create a release branch
4. Run full test suite
5. Merge to main
6. Tag the release
7. Deploy to production

## Getting Help

- Check existing documentation
- Search issue tracker
- Ask in team channels
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
