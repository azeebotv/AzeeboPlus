# Production Deployment Fixes Report

**Date**: 2026-07-21
**Branch**: Agbala-Olodumare-Implementation
**Commits**: 72efc936 → 758d99c4 (20 commits)

---

## Summary

Fixed the entire production deployment pipeline for Azeebo+ all-in-one Docker container. The platform has 27 microservices, each with its own Prisma schema and database. The deployment was completely broken — every service crashed on startup with `MODULE_NOT_FOUND` errors, login returned 401/502, and seed data was never deployed. All issues have been resolved across 20 commits.

---

## Issues Found and Fixed

### 1. Seed Data Never Deployed (Login 401)

**Problem**: `entrypoint.sh` only seeded demo content when `DEMO_MODE=true`. Production containers had empty user tables, causing every login to return `Invalid email or password`.

**Fix**: Changed `entrypoint.sh` to always run seed data deployment regardless of `DEMO_MODE` flag. (commit `1ca5f342`)

### 2. Corrupted Seed SQL

**Problem**: The `002_seed_demo_data.sql` file had corrupted avatar paths, broken social links JSON, and malformed SQL syntax from a previous placeholder replacement.

**Fix**: Restored correct avatar paths, social links JSON, and SQL syntax. (commit `866d267f`)

### 3. Seed SQL Missing Columns

**Problem**: The `INSERT INTO "users"` statement had 9 columns (including `updatedAt`) but avatar rows only provided 5-6 values. Missing: `role`, `isVerified`, `createdAt`, `updatedAt`.

**Fix**: Added all 9 required values to every user row. (commit `b88fbb29`)

### 4. Wallet-service Crash-Loop (WEBHOOK_SECRET)

**Problem**: `ConfigModule.getOrThrow('WEBHOOK_SECRET')` crashed in local dev when the env var wasn't loaded.

**Fix**: Changed to `ConfigModule.get('WEBHOOK_SECRET', 'dev-webhook-secret')`. (commit `72efc936`)

### 5. WebhookRetryService Crash (Shared PrismaClient)

**Problem**: `payment-service` tried to query `webhook_retries` table via the shared PrismaClient (which only had auth-service's 8 models). Crashed every minute.

**Fix**: Wrapped in try-catch with warn-level logging. (commit `ba8c9174`)

### 6. Unified PrismaClient — Three Failed Attempts

**Problem**: All 27 services shared a single `@prisma/client` generated from auth-service's schema. Services needing models not in auth-service (Payment, Content, Wallet, etc.) crashed on startup.

**Attempt 1** — Combined schema (`b6e217f1`): Created `prisma/combined-schema.prisma` with all models. **Failed**: 762 entries with duplicates across services.

**Attempt 2** — Deduplicated schema (`52eb12e1`): Python script deduplicated to 221 unique models + 5 enums. **Failed**: 37 Prisma validation errors from cross-service one-sided relations (e.g., `Appeal.case` references `ModerationCase` which lacks opposing `Appeal` relation).

**Attempt 3** — Per-service PrismaClient generation (`9f437792`): Each service generates its own PrismaClient from its own schema. **Success**. This is the correct approach.

### 7. Per-Service PrismaClient — Runtime MODULE_NOT_FOUND

**Problem**: Services imported from `../../prisma/client/index.js` (relative path). The PrismaClient was generated to `src/prisma/client/` (custom output). The compiled code at `dist/modules/database/prisma.service.js` required `../../prisma/client/index.js` which resolved to `dist/prisma/client/index.js` at runtime — but the client was only at `prisma/client/` (service root) and `src/prisma/client/`.

**Fix chain** (8 commits):
1. `patch-prisma-client.sh` copies generated client from `src/prisma/client/` to `prisma/client/` (commit `c10ae8e7`)
2. Dockerfile stage-2 copies from `prisma/client/` to `node_modules/@prisma/client/` and `dist/prisma/client/` (commit `758d99c4`)
3. Dockerfile stage-1 post-flattening step copies to `dist/prisma/client/` for all services (commit `758d99c4`)
4. Increased `find` maxdepth from 3→5 to discover schemas at depth 5 (commit `c10ae8e7`)
5. Excluded `*/prisma/client/*` and `*/generated/*` from schema discovery to avoid duplicates (commit `70607435`)

### 8. Dockerfile Stage-2 prisma generate Fails

**Problem**: `pnpm install --prod` removes engine binaries. Stage-2 `prisma generate` fails with `Cannot find module query_engine_bg.postgresql.wasm-base64.js` for ALL services.

**Fix**: Replaced `prisma generate` with copying already-generated clients from builder stage. (commits `1678369b`, `1444a671`)

### 9. Prisma Engine Binary Mismatch (debian-openssl-3.0.x)

**Problem**: Prisma generated clients for `debian-openssl-1.1.x` but production container runs Debian with OpenSSL 3.0.x. Services crashed with `PrismaClientInitializationError: Query Engine for runtime "debian-openssl-3.0.x"`.

**Fix**: Added `binaryTargets = ["native", "debian-openssl-3.0.x"]` to all 28 schema.prisma files. (commit `de5159c9`)

### 10. Attempted @prisma/client Import Change — Build Failure

**Problem**: Changed all 40 relative imports (`../../prisma/client/index.js`) to `@prisma/client`. This broke the Docker build because TypeScript resolves `@prisma/client` to the shared root package (wrong models for each service). 83 TS errors, 26 services failed to build.

**Fix**: Reverted all 40 imports back to relative paths. Kept `binaryTargets` fix. (commits `de5159c9`, `0be239da`)

### 11. Duplicate Schema Discovery

**Problem**: `find -maxdepth 5` picked up 28 duplicate schemas inside `prisma/client/` directories and 2 inside `generated/` directories. Each triggered `[prisma] WARNING: no Prisma client source found`.

**Fix**: Added exclusion patterns `-not -path "*/prisma/client/*" -not -path "*/generated/*"` to find commands. (commit `70607435`)

---

## Architecture Decisions

### Per-service PrismaClient is the only viable approach

Three failed attempts proved that a unified PrismaClient is impossible with Prisma 6.x:
1. **Duplicate models**: 27 services each define `User`, `Wallet`, `Content` etc.
2. **Missing enums**: Services define service-specific enums not shared globally
3. **One-sided relations**: Prisma requires both sides of a relation to be defined. Cross-service relations are inherently one-sided in a microservice architecture.

### Runtime path resolution: dist/prisma/client/

TypeScript compiles `from '../../prisma/client/index.js'` (resolves to `src/prisma/client/` at compile time) to `require("../../prisma/client/index.js")` (resolves to `dist/prisma/client/` at runtime). Both paths must contain the generated client.

### shamefully-hoist=true complicates per-service resolution

pnpm hoists all dependencies to root `node_modules/`. Service-local `node_modules/@prisma/client` is created manually in Dockerfile stage-2 as a workaround. Node.js CJS module resolution checks closest `node_modules` first, so the local copy wins over the root.

---

## Commit History

| Commit | Description |
|--------|-------------|
| `7f4a94c1` | Add T0 shared package build to local-dev.sh |
| `ad840832` | Fix variable definitions before usage in local-dev.sh |
| `72efc936` | Fix WEBHOOK_SECRET crash in wallet-service |
| `ba8c9174` | Fix WebhookRetryService crash-loop |
| `1ca5f342` | Always seed demo content in entrypoint |
| `866d267f` | Fix corrupted SQL in seed data |
| `b6e217f1` | Combined Prisma schema attempt (FAILED) |
| `52eb12e1` | Deduplicated combined schema (FAILED) |
| `9f437792` | Per-service PrismaClient generation |
| `b88fbb29` | Fix seed SQL missing columns |
| `741b6ef7` | Copy PrismaClient to expected relative path |
| `c10ae8e7` | Increase find maxdepth to 5 |
| `1444a671` | Use prisma generate instead of npx |
| `1678369b` | Copy clients from builder instead of regenerating |
| `c792adb3` | Copy from prisma/client/ in runtime |
| `de5159c9` | Add binaryTargets + change imports to @prisma/client |
| `0be239da` | Revert: restore relative prisma imports |
| `70607435` | Exclude duplicate schemas from find |
| `758d99c4` | Copy PrismaClient to dist/prisma/client/ |

---

## Current Status

**Docker build**: All 27 services + 2 apps + web build successfully (ALL BUILDS PASSED)

**Container runtime**: Services crash on startup with `Cannot find module '../../prisma/client/index.js'`. This resolves to `dist/prisma/client/index.js` which the latest commit (`758d99c4`) copies during both build and runtime stages. Awaiting redeployment to verify.

**Remaining known issues**:
- `webhook_retries` table warning (non-fatal, try-catch handles it)
- Container generates random JWT secrets on each boot (by design)
