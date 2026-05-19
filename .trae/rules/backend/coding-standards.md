# Azeebo+ Coding Standards Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Overview

This document defines coding standards and best practices for all Azeebo+ codebases across backend services, frontend applications, and shared packages.

---

## TypeScript Standards

### Version

- Use TypeScript 5.x
- Enable strict mode in `tsconfig.json`

### Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### File Naming

- Classes: `PascalCase.ts`
- Interfaces: `PascalCase.ts` (prefix with `I` if preferred)
- Types: `PascalCase.ts`
- Enums: `PascalCase.ts`
- Utilities: `camelCase.ts`
- Services: `camelCase.service.ts`
- Controllers: `camelCase.controller.ts`

### Code Style

#### Imports

```typescript
// ✅ Good
import { UserService } from './user.service';
import { User } from '../types/user';
import { formatCurrency } from '../utils/format';

// ❌ Bad
import { UserService } from './user.service';
import { User } from '../types/user';
import { formatCurrency } from '../utils/format';
import { something } from 'somewhere';
```

#### Variable Declarations

```typescript
// ✅ Good
const userId: string = '123';
let isActive: boolean = true;
const config: Config = {
  timeout: 5000,
  retries: 3,
};

// ❌ Bad
var userId = '123';
let isActive;
const config = { timeout: 5000 };
```

#### Functions

```typescript
// ✅ Good
function getUserById(userId: string): Promise<User | null> {
  return db.query('SELECT * FROM users WHERE id = $1', [userId]);
}

const createUser = async (userData: CreateUserDto): Promise<User> => {
  return db.transaction(async (tx) => {
    return tx.query('INSERT INTO users ...');
  });
};

// ❌ Bad
function getUserById(userId) {
  return db.query('SELECT * FROM users WHERE id = ' + userId);
}
```

#### Classes

```typescript
// ✅ Good
class UserService {
  private readonly db: Database;
  private readonly logger: Logger;

  constructor(db: Database, logger: Logger) {
    this.db = db;
    this.logger = logger;
  }

  async getUser(id: string): Promise<User | null> {
    return this.db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
}

// ❌ Bad
class UserService {
  db;
  logger;

  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
  }
}
```

---

## Backend Standards (NestJS)

### Project Structure

```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   ├── pipes/
│   └── middleware/
├── modules/
│   ├── auth/
│   ├── users/
│   └── ...
└── config/
    ├── database.config.ts
    └── app.config.ts
```

### Module Structure

```
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   └── jwt.strategy.ts
├── dto/
│   ├── login.dto.ts
│   └── register.dto.ts
├── entities/
│   └── user.entity.ts
└── interfaces/
    └── auth-response.interface.ts
```

### Controllers

```typescript
// ✅ Good
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @HttpCode(200)
  async getUser(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @HttpCode(200)
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }
}

// ❌ Bad
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':id')
  getUser(@Param('id') id) {
    return this.usersService.findById(id);
  }
}
```

### Services

```typescript
// ✅ Good
@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly bcryptService: BcryptService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) return null;

    const isPasswordValid = await this.bcryptService.compare(
      password,
      user.password,
    );
    if (!isPasswordValid) return null;

    return user;
  }
}

// ❌ Bad
@Injectable()
export class AuthService {
  validateUser(email, password) {
    // Implementation here
  }
}
```

### DTOs

```typescript
// ✅ Good
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  displayName: string;
}

// ❌ Bad
export class CreateUserDto {
  email;
  password;
  displayName;
}
```

### Exception Filters

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    response.status(status).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

---

## Frontend Standards (React/Next.js)

### Project Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── home/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   └── api/
│       └── route.ts
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   └── card.tsx
│   └── features/
│       ├── navbar.tsx
│       └── footer.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useWallet.ts
├── lib/
│   ├── api.ts
│   └── utils.ts
├── styles/
│   └── globals.css
└── types/
    └── index.ts
```

### Components

```typescript
// ✅ Good
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  className,
  ...props
}) => {
  const baseStyles = 'rounded-lg font-medium transition-colors';
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-secondary text-white hover:bg-secondary-dark',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  };
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

// ❌ Bad
export const Button = ({ variant, size, isLoading, children, className, ...props }) => {
  return (
    <button className={`btn ${variant} ${size} ${className}`} {...props}>
      {isLoading ? 'Loading...' : children}
    </button>
  );
};
```

### Pages

```typescript
// ✅ Good
import { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';

interface Props {
  initialUser: User;
}

export default function ProfilePage({ initialUser }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(initialUser);
    setLoading(false);
  }, [initialUser]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div>
      <h1>{user.displayName}</h1>
      <p>{user.email}</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.req.cookies['auth_token'];
  
  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const user = await fetchUser(token);
    return { props: { initialUser: user } };
  } catch (error) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

// ❌ Bad
export default function ProfilePage({ user }) {
  return (
    <div>
      <h1>{user.displayName}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### API Routes

```typescript
// ✅ Good
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, displayName: true },
      });

      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ❌ Bad
export default function handler(req, res) {
  // No auth check
  if (req.method === 'GET') {
    // Direct query without error handling
  }
}
```

---

## Styling Standards

### CSS Modules

```typescript
// ✅ Good
// Button.module.css
.button {
  @apply rounded-lg font-medium transition-colors;
}

.buttonPrimary {
  @apply bg-primary text-white hover:bg-primary-dark;
}

.buttonLoading {
  @apply cursor-not-allowed opacity-75;
}

// Button.tsx
import styles from './Button.module.css';

export const Button = ({ className, isLoading, ...props }) => {
  return (
    <button
      className={`${styles.button} ${isLoading ? styles.buttonLoading : ''} ${className}`}
      {...props}
    />
  );
};
```

### Tailwind CSS

```typescript
// ✅ Good
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
  <div className="text-gray-900 font-medium">Title</div>
  <button className="text-blue-600 hover:text-blue-800">Action</button>
</div>

// ❌ Bad
<div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm">
  <div className="text-gray-900 font-medium">Title</div>
  <button className="text-blue-600 hover:text-blue-800">Action</button>
</div>
```

---

## Git Standards

### Commit Messages

```
feat: add user authentication
fix: resolve wallet balance calculation bug
docs: update API documentation
refactor: extract payment service logic
test: add unit tests for auth service
chore: update dependencies
```

### Branch Naming

```
feature/auth-service
feature/user-profile
fix/wallet-bug
docs/api-endpoints
refactor/payment-service
```

### Pull Request Guidelines

- Title: Clear, descriptive (under 70 characters)
- Description: Include context, changes, testing notes
- Labels: Add appropriate labels (bug, feature, breaking, etc.)
- Reviewers: Request at least 1 reviewer
- Checks: All CI checks must pass

---

## Documentation Standards

### JSDoc Comments

```typescript
/**
 * Finds a user by their email address.
 * @param email - The user's email address
 * @returns The user object if found, null otherwise
 */
async function findUserByEmail(email: string): Promise<User | null> {
  return db.query('SELECT * FROM users WHERE email = $1', [email]);
}

/**
 * User service for managing user profiles and preferences.
 */
@Injectable()
export class UserService {
  /**
   * Creates a new user service instance.
   * @param db - The database connection
   * @param logger - The logger instance
   */
  constructor(
    private readonly db: Database,
    private readonly logger: Logger,
  ) {}
}
```

### README Files

Each service/app should have a README.md with:

- Overview
- Technology stack
- Project structure
- Setup instructions
- Running locally
- Running tests
- API documentation link

---

## Prohibited Patterns

### Backend

- No direct database queries in controllers
- No business logic in controllers
- No hardcoded secrets
- No console.log in production code
- No unhandled promises
- No circular dependencies

### Frontend

- No direct DOM manipulation
- No global state without proper management
- No hardcoded API URLs
- No console.log in production code
- No unhandled promise rejections
- No memory leaks (cleanup effects)

---

## Code Review Checklist

- [ ] Code follows project conventions
- [ ] No linting errors
- [ ] Type safety maintained
- [ ] Error handling implemented
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance considerations
- [ ] Accessibility considerations