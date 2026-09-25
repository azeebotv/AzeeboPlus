# Code Style Guide — Azeebo+

This guide ensures consistent code quality across the project.

---

## TypeScript / JavaScript

### General Rules
- Use TypeScript for all new code
- Prefer `const` over `let`
- Use async/await over raw promises
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Destructure objects when accessing multiple properties

### Naming Conventions
```typescript
// Variables and functions: camelCase
const userName = 'John';
function getUser() {}

// Classes and types: PascalCase
class UserService {}
interface UserProfile {}

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.azeebo.com';

// Private members: prefix with underscore
class Service {
  private _cache = new Map();
}
```

### Function Rules
- Keep functions under 30 lines
- One function = one responsibility
- Use descriptive names, not abbreviations
- Return early for edge cases

```typescript
// Good
function getUserDisplayName(user: User): string {
  if (!user) return 'Unknown';
  if (user.displayName) return user.displayName;
  return user.email.split('@')[0];
}

// Bad
function g(u: any) {
  let r = '';
  if (u) {
    if (u.dn) {
      r = u.dn;
    } else {
      r = u.e.split('@')[0];
    }
  }
  return r;
}
```

### Error Handling
- Always handle errors explicitly
- Use custom error classes for domain errors
- Log errors with context
- Never swallow errors silently

```typescript
// Good
try {
  await saveUser(data);
} catch (error) {
  logger.error('Failed to save user', { userId: data.id, error });
  throw new AppError('USER_SAVE_FAILED', 'Could not save user');
}

// Bad
try {
  await saveUser(data);
} catch (e) {
  // silent
}
```

---

## React / Next.js

### Component Rules
- Use functional components only
- Use hooks for state and side effects
- Keep components under 200 lines
- Extract complex logic to custom hooks
- Use TypeScript interfaces for props

```typescript
// Good
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

function Button({ variant, size = 'md', children, onClick }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} btn-${size}`} onClick={onClick}>
      {children}
    </button>
  );
}
```

### Hook Rules
- Custom hooks must start with `use`
- Don't call hooks conditionally
- Keep hooks focused on one concern

```typescript
// Good
function useAuth() {
  const { user, loading } = useContext(AuthContext);
  return { user, loading, isAuthenticated: !!user };
}

// Bad
function useAuthAndTheme() {
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  return { user, theme };
}
```

### State Management
- Use React Query for server state
- Use Zustand for client state
- Avoid prop drilling beyond 3 levels
- Keep state as close to usage as possible

---

## NestJS / Backend

### Controller Rules
- Keep controllers thin (routing + validation only)
- Use DTOs for request/response validation
- Apply guards and decorators consistently
- Use proper HTTP status codes

```typescript
// Good
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
```

### Service Rules
- Services handle business logic only
- Use dependency injection
- Keep services under 300 lines
- Extract complex queries to repositories

### Database Rules
- Use Prisma for all database access
- Always use transactions for multi-step operations
- Add indexes for frequently queried columns
- Use select to fetch only needed fields

```typescript
// Good
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    username: true,
    avatar: true,
  },
});

// Bad
const user = await prisma.user.findUnique({
  where: { id },
  // selects everything including password hash
});
```

---

## CSS / Styling

### Tailwind Rules
- Use design tokens from `@azeebo/design-tokens`
- Prefer utility classes over custom CSS
- Use responsive prefixes consistently
- Keep class order consistent

```html
<!-- Good -->
<div className="flex items-center gap-4 p-4 bg-surface rounded-lg">

<!-- Bad -->
<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
```

### CSS Variables
```css
/* Use design tokens */
color: var(--text-primary);
background: var(--bg-secondary);
border: 1px solid var(--border-default);

/* Avoid hardcoded values */
color: #333;
background: #1a1a2e;
```

---

## Testing

### Unit Tests
- Test behavior, not implementation
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Mock external dependencies

```typescript
// Good
describe('formatCurrency', () => {
  it('formats NGN currency with comma separators', () => {
    const result = formatCurrency(1500);
    expect(result).toContain('1,500');
  });
});
```

### E2E Tests
- Test critical user flows
- Use data-testid for selectors
- Keep tests independent
- Clean up after tests

---

## Git

### Commit Messages
Follow Conventional Commits:
```
feat: add user profile avatar upload
fix: resolve wallet balance calculation
docs: update API reference
refactor: extract caching logic to service
test: add auth flow E2E tests
```

### Branch Naming
```
feature/user-avatar-upload
fix/wallet-balance-calculation
chore/update-dependencies
```

---

## Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests pass
- [ ] No console.log in production code
- [ ] Error handling is proper
- [ ] TypeScript types are correct
- [ ] No hardcoded values
- [ ] Documentation updated if needed
- [ ] Security considerations addressed
