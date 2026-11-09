# Azeebo+ Deployment

> Deployment scripts, configs, and infrastructure for Azeebo+ platform.

## Overview

This directory contains deployment-related files for running Azeebo+ in various environments.

## Files

| File                            | Purpose                                           |
| ------------------------------- | ------------------------------------------------- |
| `coolify-init.sql`              | Initial SQL setup for Coolify-managed PostgreSQL  |
| `docker-bake.hcl`               | Docker Buildx bake file for multi-platform builds |
| `docker-compose.all-in-one.yml` | Single-container deployment (all services)        |
| `docker-compose.base.yml`       | Base compose config for multi-container setup     |
| `entrypoint.sh`                 | Container entrypoint script                       |
| `nginx.conf`                    | Nginx reverse proxy configuration                 |
| `staging.env`                   | Staging environment variables                     |
| `supervisord.conf`              | Process manager config for all-in-one container   |
| `supervisord.nixpacks.conf`     | Nixpacks-specific process manager config          |

## Deployment Options

### Option 1: All-in-One Container (Recommended)

Uses a single Docker container running all services via supervisord.

**Requirements:**

- VPS with 8GB+ RAM
- Docker installed
- Coolify or similar container management

**Steps:**

1. Set environment variables in your deployment platform
2. Point to `docker-compose.all-in-one.yml`
3. Deploy

### Option 2: Coolify Managed

For production deployments on a VPS:

1. Create a Coolify project with Docker Compose type
2. Use `docker-compose.all-in-one.yml`
3. Add all env vars in Coolify UI
4. Deploy

## Environment Variables

See `staging.env` for required staging variables. All passwords and secrets must be replaced before deployment. See `.env.example` at project root for full variable reference.

GitHub Actions repository variables (set under Settings → Variables, not as secrets). Each falls back to the canonical domain when unset:

- `STAGING_BASE_URL` — used by `rollback.yml` for the staging environment link (default `https://staging.azeeboplus.com`).
- `PRODUCTION_BASE_URL` — used by `rollback.yml` for the production environment link (default `https://azeeboplus.com`).
- `NEXT_PUBLIC_API_URL` — staging web build API origin used by `cd.yml` and `cd-all-in-one.yml` (default `https://staging.azeeboplus.com`).

## CDN Hostnames

`cdn-config.json` carries hostnames in four places (API origin, CloudFront aliases, CORS
allowlist, CSP `connect-src`). They are generated from the domain registry, never hand-edited:

- `pnpm generate:cdn-config` rewrites them from `packages/shared-types/src/platform-domains.json`
  (the staging API host comes from `subdomains.stagingApi`, i.e. `staging-api.azeeboplus.com`).
- `pnpm check:cdn-hosts` fails the PR when the file has drifted; CI runs it in the conventions job.

`CDN_BASE_URL=https://... node scripts/generate-cdn-config.mjs` overrides the cdn/media aliases
for a preview edge while leaving every other host registry-derived.

## Security Notes

- Never commit `.env` files with real secrets
- Use a secrets manager for production credentials
- Rotate all secrets before first production deployment
- Use strong, unique passwords for all database connections

## Troubleshooting

### Services not starting

- Check container logs: `docker logs <container-name>`
- Ensure all required environment variables are set
- Check if PostgreSQL is healthy: `curl http://localhost:3013/health`

### Database connection issues

- Verify PostgreSQL is running and accepting connections
- Check database credentials in environment variables
- Ensure databases are created (run `coolify-init.sql` if needed)

### Port conflicts

- Default ports: 3013 (gateway), 4000 (web), 4014 (creator), 4016 (admin)
- Ensure these ports are available on your host
