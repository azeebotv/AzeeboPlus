# Skill: Add Prisma Schema

> Add or modify Prisma schema for a service.

---

## Usage

```
/add-prisma-schema [service] [model-name]

Example:
/add-prisma-schema reality-service Show
/add-prisma-schema wallet-service Transaction
/add-prisma-schema creator-service CreatorProfile
```

## What It Does

1. Adds the model to the service's `prisma/schema.prisma`
2. Includes proper relations and indexes
3. Adds enum types if needed
4. Generates migration
5. Updates PrismaClient

## Template: Model

```prisma
model Show {
  id          String   @id @default(uuid())
  title       String
  description String?
  status      ShowStatus @default(DRAFT)
  season      Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  episodes    Episode[]
  contestants Contestant[]
  votes       Vote[]

  @@index([status])
  @@index([createdAt])
}

enum ShowStatus {
  DRAFT
  ACTIVE
  COMPLETED
  ARCHIVED
}
```

## Rules

- Every model must have `id` (UUID), `createdAt`, `updatedAt`
- Use enums for status fields
- Add indexes on frequently queried fields
- Never store sensitive data (passwords, card numbers)
- Use proper relations (one-to-many, many-to-many)
- Keep schemas normalized (3NF)
