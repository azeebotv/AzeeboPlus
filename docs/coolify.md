# Deploying Azeebo+ on Coolify - Complete Guide

> **Last Updated:** May 2026 | **Version:** 1.0

---

## Table of Contents

1. [What is Coolify?](#what-is-coolify)
2. [Why Use Coolify for Azeebo+?](#why-use-coolify-for-azeebo)
3. [Prerequisites](#prerequisites)
4. [Step 1: Install Coolify on Your Server](#step-1-install-coolify-on-your-server)
5. [Step 2: Configure Coolify](#step-2-configure-coolify)
6. [Step 3: Prepare the Azeebo+ Repository](#step-3-prepare-the-azeebo-repository)
7. [Step 4: Create Docker Compose Resource](#step-4-create-docker-compose-resource)
8. [Step 5: Configure Environment Variables](#step-5-configure-environment-variables)
9. [Step 6: Deploy Services](#step-6-deploy-services)
10. [Step 7: Configure Domain and SSL](#step-7-configure-domain-and-ssl)
11. [Step 8: Post-Deployment Setup](#step-8-post-deployment-setup)
12. [Database Management](#database-management)
13. [Updating Your Deployment](#updating-your-deployment)
14. [Monitoring and Logs](#monitoring-and-logs)
15. [Troubleshooting](#troubleshooting)
16. [FAQ](#faq)

---

## What is Coolify?

**Coolify** is an open-source, self-hosted platform-as-a-service (PaaS) that simplifies deploying applications to your own server(s). It's a modern alternative to:

| Platform | Coolify Advantage |
|----------|------------------|
| Vercel | Full control, no usage limits |
| Heroku | Free tier alternatives, predictable pricing |
| Netlify | No bandwidth limits, full ownership |
| Railway | More flexible, unlimited projects |

### Coolify Features

- **One-Click Deployments** - Deploy from Git repositories
- **Automatic SSL** - Let's Encrypt certificates
- **Docker & Docker Compose** - Full container support
- **Databases** - PostgreSQL, MySQL, Redis, MongoDB built-in
- **Reverse Proxy** - Automatic Nginx configuration
- **CI/CD** - Automatic builds on git push
- **Multi-Server** - Deploy across multiple servers
- **Resource Monitoring** - Built-in CPU, RAM, disk metrics

---

## Why Use Coolify for Azeebo+?

### Pros

| Benefit | Description |
|---------|-------------|
| **Full Control** | You own everything - no vendor lock-in |
| **Cost Effective** | No per-minute billing, predictable server costs |
| **Microservices Ready** | Native Docker Compose support |
| **Auto-Scaling** | Deploy across multiple servers |
| **SSL Built-in** | Automatic HTTPS with Let's Encrypt |
| **Database Management** | Built-in PostgreSQL, Redis tools |

### Cons

| Challenge | Mitigation |
|-----------|------------|
| **Self-Managed** | You handle server maintenance |
| **Initial Setup** | More complex than SaaS platforms |
| **Resource Limits** | Bound by your server specs |

---

## Prerequisites

### Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **CPU** | 2 cores | 4 cores |
| **RAM** | 4 GB | 8 GB |
| **Disk** | 40 GB SSD | 80 GB SSD |
| **OS** | Ubuntu 20.04+ | Ubuntu 22.04 LTS |

### Supported Cloud Providers

- **AWS EC2**
- **DigitalOcean Droplets**
- **Vultr**
- **Linode**
- **Hetzner**
- **Oracle Cloud (Always Free)**
- **Any VPS with Ubuntu/Debian**

### Local Requirements (Your Computer)

| Tool | Purpose |
|------|---------|
| **Git** | Version control |
| **Terminal** | SSH access to server |
| **Web Browser** | Coolify dashboard |
| **Domain (Optional)** | For SSL and custom URLs |

---

## Step 1: Install Coolify on Your Server

### Option A: Automated Installation (Recommended)

Connect to your server via SSH:

```bash
ssh root@your-server-ip
```

Run the Coolify installation script:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

**Expected Output:**
```
 _____ _____ ____  ____  _____
|  _  |  ___|  _ \|  _ \|_   _|
| | | | |__ | | | | | | | | |
| | | |  __|| | | | | | | | |
| |/ /| |___| |_| | |_| | | |
|___/ \____/|____/|____/  |_|

Welcome to Coolify v4.x.x
Starting installation...
```

### Option B: Docker Installation (Existing Docker)

If you already have Docker installed:

```bash
# Create volume for Coolify data
docker volume create coolify

# Run Coolify container
docker run -d \
  --name coolify \
  --network coolify \
  -p 80:80 \
  -p 443:443 \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v coolify:/coolify \
  -v ~/.ssh:/root/.ssh \
  -e APP_ID=1 \
  -e APP_KEY=your-32-character-app-key \
  -e APP_URL=http://your-server-ip:8080 \
  -e APP_PORT=8080 \
  -e DATABASE_URL=postgresql://coolify:password@host.docker.internal:5432/coolify \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  --restart unless-stopped \
  --sysctls net.ipv4.ip_unprivileged_port_start=0 \
  -d coolifyself/coolify:latest
```

### Option C: Manual Installation

For advanced users who want more control:

```bash
# Create coolify user
sudo useradd -m -s /bin/bash coolify
sudo usermod -aG docker coolify

# Create directories
sudo mkdir -p /opt/coolify/{source,database,redis,ssh,applications}
sudo chown -R coolify:coolify /opt/coolify

# Clone Coolify repository
cd /opt/coolify
sudo -u coolify git clone https://github.com/coollabsio/coolify.git source

# Configure systemd service
sudo nano /etc/systemd/system/coolify.service
```

---

## Step 2: Configure Coolify

### Access Coolify Dashboard

1. Open your browser
2. Navigate to `http://your-server-ip:8080`
3. You'll see the initial setup screen

### Initial Setup

**First-Time Configuration:**

1. **Create Admin Account**
   - Email: `admin@example.com`
   - Password: `YourSecurePassword123!`

2. **Add SSH Key**
   ```bash
   # On your local machine, generate SSH key
   ssh-keygen -t ed25519 -C "coolify-deploy"

   # Copy public key
   cat ~/.ssh/id_ed25519.pub
   # ssh-ed25519 AAAAC3... coolify-deploy
   ```

3. **Add Server**
   - Click "Add Server"
   - Paste your server's SSH connection string
   - Paste the public SSH key

### Server Configuration

After adding your server, Coolify will:

1. **Install Docker** (if not present)
2. **Configure SSH** keys
3. **Setup Networks** for containers
4. **Install Traefik** (reverse proxy)

**Verification:**
```bash
# Check Coolify is running
docker ps | grep coolify

# Check Traefik (reverse proxy)
docker ps | grep traefik
```

---

## Step 3: Prepare the Azeebo+ Repository

### Fork the Repository

1. Go to the Azeebo+ GitHub repository
2. Click "Fork" button
3. Select your GitHub account

### Clone to Your Account

```bash
# Clone your forked repository locally
git clone https://github.com/your-username/azeebo-plus.git
cd azeebo-plus

# Add upstream for future updates
git remote add upstream https://github.com/original-org/azeebo-plus.git
```

### Required Modifications

Create a `coolify/docker-compose.yml` file for deployment:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: azeebo_postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-azeebo_plus_dev}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - azeebo_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: azeebo_redis
    volumes:
      - redis_data:/data
    networks:
      - azeebo_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  auth-service:
    build:
      context: ./services/auth-service
      dockerfile: Dockerfile
    container_name: azeebo_auth_service
    ports:
      - "3001:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL:-redis://redis:6379}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-30m}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - azeebo_network
    restart: unless-stopped

  # Add other services similarly...
  # user-service, wallet-service, payment-service, etc.

networks:
  azeebo_network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

---

## Step 4: Create Docker Compose Resource

### In Coolify Dashboard

1. **Click "Create New Resource"**
2. **Select "Docker Compose"**
3. **Configure Source**
   - Repository: `https://github.com/your-username/azeebo-plus`
   - Branch: `main`
   - Docker Compose location: `coolify/docker-compose.yml`

### Build Settings

| Setting | Value |
|---------|-------|
| **Build Type** | Docker Compose |
| **Auto Deploy** | ✅ Enabled |
| **Preview Deployments** | ✅ Enabled |
| **Force Rebuilt** | ❌ Disabled |

### Resource Settings

| Setting | Value |
|---------|-------|
| **Name** | azeebo-plus |
| **Description** | Azeebo+ Streaming Platform |
| **FQDN** | `api.your-domain.com` (optional) |

---

## Step 5: Configure Environment Variables

### Coolify Environment Variables

In the Coolify dashboard, go to your project's **Environment Variables** section and add:

### Required Variables

```bash
# ============================================
# DATABASE CONFIGURATION
# ============================================

DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/azeebo_plus_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YourSecurePostgresPassword123!
POSTGRES_DB=azeebo_plus_dev

# ============================================
# REDIS CONFIGURATION
# ============================================

REDIS_URL=redis://redis:6379

# ============================================
# AUTHENTICATION
# ============================================

JWT_SECRET=YourSuperSecretJWTTokenKeyMinimum32CharactersLong!
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# APPLICATION SETTINGS
# ============================================

NODE_ENV=production
API_GATEWAY_URL=https://api.your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# ============================================
# PAYMENT PROVIDERS
# ============================================

PAYSTACK_SECRET_KEY=sk_live_your_paystack_key
PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_key
PAYSTACK_WEBHOOK_SECRET=whsec_your_webhook_secret

# ============================================
# EMAIL CONFIGURATION
# ============================================

SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@your-domain.com
```

### Secret Variables (Recommended)

For sensitive values, mark these as **Secret**:

| Variable | Secret | Value |
|----------|--------|-------|
| `DATABASE_PASSWORD` | ✅ Yes | Your DB password |
| `JWT_SECRET` | ✅ Yes | Your JWT secret |
| `PAYSTACK_SECRET_KEY` | ✅ Yes | Your Paystack key |
| `SMTP_PASSWORD` | ✅ Yes | Your SMTP password |

---

## Step 6: Deploy Services

### Initial Deployment

1. **Click "Deploy"** button in Coolify
2. **Watch the logs** - Click "Follow Logs" to monitor progress

**Expected Deployment Process:**
```
[DEPLOY] Pulling Docker images...
[DEPLOY] Building auth-service...
[DEPLOY] Building user-service...
[DEPLOY] Starting postgres...
[DEPLOY] Starting redis...
[DEPLOY] Starting auth-service...
[DEPLOY] Running migrations...
[DEPLOY] Deployment complete!
```

### Deployment Time

| Phase | Estimated Time |
|-------|---------------|
| First deployment | 10-15 minutes |
| Subsequent deployments | 2-5 minutes |
| Database migrations | 30-60 seconds |

### Verify Deployment

```bash
# Check all containers are running
docker ps | grep azeebo

# Expected output:
# azeebo_postgres          Up (healthy)
# azeebo_redis            Up (healthy)
# azeebo_auth_service     Up
# azeebo_user_service     Up
# azeebo_wallet_service   Up
# azeebo_payment_service  Up
# ...

# Check health endpoint
curl http://localhost:3000/health
```

---

## Step 7: Configure Domain and SSL

### Add Domain in Coolify

1. Go to your project **Settings**
2. Click **Domains**
3. Add your domain: `api.your-domain.com`

### DNS Configuration

Add the following DNS records at your domain provider:

| Record Type | Name | Value |
|-------------|------|-------|
| **A** | `api` | `your-server-ip` |
| **A** | `www` | `your-server-ip` |
| **A** | `@` | `your-server-ip` |

### Automatic SSL

Coolify automatically:
1. Detects new domain
2. Requests Let's Encrypt certificate
3. Configures Nginx/Traefik
4. Enforces HTTPS

**Verification:**
```bash
# Check SSL certificate
curl -v https://api.your-domain.com/health 2>&1 | grep "SSL"

# Should show:
# *  SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384
```

---

## Step 8: Post-Deployment Setup

### Run Database Migrations

In Coolify dashboard:

1. Go to your project **→ Containers**
2. Select `postgres` container
3. Click **Exec** to open terminal
4. Run migrations:

```bash
# Generate Prisma clients
pnpm -r exec prisma generate

# Run migrations
pnpm -r exec prisma migrate deploy
```

### Create Initial Admin User

```bash
# Open auth service terminal
docker exec -it azeebo_auth_service sh

# Run seed script (if available)
pnpm prisma db seed
```

### Configure Backup

In Coolify dashboard:

1. Go to **Backups**
2. Click **Add Backup**
3. Configure:
   - **Source:** PostgreSQL volume
   - **Destination:** S3 / Local / FTP
   - **Schedule:** Daily at 2:00 AM

---

## Database Management

### Access PostgreSQL

**Option A: Through Coolify Terminal**

```bash
# In Coolify, go to postgres container → Exec
psql -U postgres -d azeebo_plus_dev
```

**Option B: Using pgAdmin**

1. Deploy pgAdmin from Coolify marketplace
2. Connect using:
   - Host: `postgres`
   - Port: `5432`
   - Database: `azeebo_plus_dev`
   - Username: `postgres`

### Common Database Commands

```sql
-- List all tables
\dt

-- List users
\du

-- List databases
\l

-- Switch database
\c azeebo_plus_dev

-- Show table structure
\d users

-- Query users
SELECT * FROM users LIMIT 10;
```

### Reset Database

**WARNING: This deletes all data!**

```bash
# In postgres container terminal
psql -U postgres -c "DROP DATABASE azeebo_plus_dev;"
psql -U postgres -c "CREATE DATABASE azeebo_plus_dev;"

# Then run migrations again
pnpm -r exec prisma migrate deploy
```

---

## Updating Your Deployment

### Automatic Updates (Recommended)

In Coolify:

1. Go to project **Settings**
2. Enable **Auto Deploy**
3. Select branch: `main`

Now, every push to `main` will automatically trigger a new deployment.

### Manual Updates

```bash
# Pull latest code
git pull origin main

# Push to trigger deployment
git push origin main
```

### Rollback

If a deployment fails:

1. Go to **Deployments** in Coolify
2. Find the last working deployment
3. Click **Rollback**

---

## Monitoring and Logs

### Coolify Dashboard

| Feature | Location |
|---------|----------|
| **Container Status** | Project → Containers |
| **Resource Usage** | Server → Resources |
| **Deployment Logs** | Project → Deployments |
| **Application Logs** | Container → Logs |

### View Container Logs

```bash
# In Coolify, click container → Logs

# Or via command line:
docker logs azeebo_auth_service
docker logs azeebo_postgres --tail 100
```

### Resource Monitoring

```bash
# Check resource usage
docker stats

# Expected output:
# CONTAINER           CPU %   MEM %   NET I/O
# azeebo_postgres     0.12%   45.32%  1.23MB / 567KB
# azeebo_redis        0.08%   12.34%  2.34MB / 1.23MB
# azeebo_auth_service 1.23%   23.45%  5.67MB / 3.45MB
```

---

## Troubleshooting

### Container Won't Start

**Symptom:** Container shows red status in Coolify

**Diagnosis:**
```bash
# Check container logs
docker logs azeebo_auth_service

# Common causes:
# 1. Missing environment variables
# 2. Database connection failed
# 3. Port already in use
```

**Solutions:**

1. **Missing Environment Variable**
   - Go to Project → Environment
   - Add missing variable
   - Redeploy

2. **Database Connection Failed**
   ```bash
   # Check postgres is running
   docker ps | grep postgres
   
   # Test connection from auth-service
   docker exec -it azeebo_auth_service sh
   nc -zv postgres 5432
   ```

3. **Port Conflict**
   ```bash
   # Find what's using the port
   lsof -i :3000
   
   # Change port in docker-compose.yml
   # Then redeploy
   ```

### SSL Certificate Issues

**Symptom:** Browser shows "Your connection is not private"

**Solutions:**

1. **Wait for Certificate**
   ```bash
   # Certificates can take up to 5 minutes
   # Check certificate status
   docker exec traefik ls -la /letsencrypt/acme.json
   ```

2. **Force Renewal**
   ```bash
   # Restart Traefik
   docker restart traefik
   ```

3. **Check Domain DNS**
   ```bash
   # Verify DNS propagation
   dig api.your-domain.com
   
   # Should point to your server IP
   ```

### Database Migration Failed

**Symptom:** Migration error in deployment logs

**Diagnosis:**
```bash
# Check migration logs
docker logs azeebo_auth_service 2>&1 | grep -i migrate

# Common errors:
# - Duplicate migration
# - Missing table
# - Column already exists
```

**Solutions:**

1. **For Duplicate Migration**
   ```bash
   # Remove applied migration record
   psql -U postgres -d azeebo_plus_dev
   DELETE FROM _prisma_migrations WHERE migration_name = 'your_migration';
   ```

2. **Reset Migrations (Development)**
   ```bash
   # Drop all tables
   psql -U postgres -d azeebo_plus_dev -c "DROP SCHEMA public CASCADE;"
   psql -U postgres -d azeebo_plus_dev -c "CREATE SCHEMA public;"
   
   # Redeploy
   ```

### Performance Issues

**Symptom:** Slow response times

**Diagnosis:**
```bash
# Check resource usage
docker stats

# Check database connections
psql -U postgres -d azeebo_plus_dev -c "SELECT count(*) FROM pg_stat_activity;"
```

**Solutions:**

1. **Add More RAM**
   - Upgrade server or add swap
   ```bash
   # Add 4GB swap
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

2. **Optimize PostgreSQL**
   ```sql
   -- Increase shared buffers
   ALTER SYSTEM SET shared_buffers = '256MB';
   
   -- Increase max connections
   ALTER SYSTEM SET max_connections = 200;
   
   -- Reload configuration
   SELECT pg_reload_conf();
   ```

---

## FAQ

### Q: How many servers do I need?

**A:** For Azeebo+, we recommend:
- **1 Server** - Up to 10 services (4GB+ RAM)
- **2 Servers** - 10-20 services (8GB+ RAM each)
- **3+ Servers** - Production with high availability

### Q: Can I use Coolify with Docker Swarm or Kubernetes?

**A:** Currently, Coolify supports:
- ✅ Docker Standalone
- ✅ Docker Compose
- ✅ Traefik
- ❌ Kubernetes (planned)
- ❌ Docker Swarm (no current support)

### Q: How do I backup my data?

**A:** Coolify offers:
1. **Built-in Backups** - Schedule automatic backups
2. **Volume Snapshots** - Snapshot Docker volumes
3. **Manual Backup**:
   ```bash
   # Backup database
   docker exec azeebo_postgres pg_dump -U postgres azeebo_plus_dev > backup.sql
   
   # Backup volumes
   docker run --rm -v azeebo_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz /data
   ```

### Q: Can I use my existing PostgreSQL or Redis?

**A:** Yes! Modify your `docker-compose.yml`:

```yaml
services:
  # Remove postgres service if using external
  
  auth-service:
    environment:
      DATABASE_URL: postgresql://user:pass@your-external-postgres:5432/azeebo_plus_dev
      REDIS_URL: redis://your-external-redis:6379
```

### Q: How do I add more services later?

**A:**

1. Add service to `coolify/docker-compose.yml`
2. Commit and push to Git
3. Coolify auto-detects changes and offers deployment
4. Add required environment variables
5. Deploy

### Q: Is Coolify free?

**A:** Coolify has two versions:

| Version | License | Cost |
|---------|---------|------|
| **Open Source** | AGPL-3.0 | Free forever |
| **Cloud** | Proprietary | Usage-based |

For self-hosting, the open-source version is free and fully functional.

### Q: How do I update Coolify itself?

**A:**

```bash
# SSH into your server
ssh root@your-server-ip

# Update Coolify
coolify update

# Or manually:
cd /opt/coolify/source
docker compose pull
docker compose up -d
```

---

## Summary

| Task | Complexity | Time |
|------|------------|------|
| Install Coolify | Easy | 10-15 min |
| Configure Server | Medium | 15-20 min |
| Deploy Azeebo+ | Medium | 15-20 min |
| Configure Domain/SSL | Easy | 5-10 min |
| Database Setup | Medium | 10-15 min |

**Total Time:** ~1 hour for initial setup

---

## Additional Resources

- [Coolify Documentation](https://coolify.io/docs)
- [Coolify GitHub](https://github.com/coollabsio/coolify)
- [Coolify Discord](https://coolify.io/discord)
- [Azeebo+ Documentation](../docs/)
