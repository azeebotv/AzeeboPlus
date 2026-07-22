# Skill: DB Migrate

> Run Prisma migrations for a specific service or all services.

---

## Usage

```
/db-migrate [service] [--seed]

Examples:
/db-migrate reality-service
/db-migrate wallet-service --seed
/db-migrate --all
/db-migrate --status
```

## What It Does

1. Checks current migration status
2. Runs pending migrations
3. Optionally seeds the database
4. Generates PrismaClient

## Commands

| Command | Description |
|---------|-------------|
| `db-migrate [service]` | Run migrations for one service |
| `db-migrate [service] --seed` | Run migrations + seed data |
| `db-migrate --all` | Run migrations for all services |
| `db-migrate --status` | Show migration status for all services |
| `db-migrate --reset [service]` | Drop, recreate, migrate, seed (DESTRUCTIVE) |

## Manual Commands

```bash
# Run migration
cd services/[category]/[service-name]
npx prisma migrate dev

# Generate PrismaClient
npx prisma generate

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio

# Reset database (DESTRUCTIVE)
npx prisma migrate reset --force
```

## Rules

- Never run `migrate reset` on production
- Always review migration SQL before applying
- Keep migrations atomic (one change per migration)
- Test migrations on dev before staging/production
