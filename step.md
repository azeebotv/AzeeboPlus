# Testing Azeebo+ Project - Complete Setup Guide

> **Last Updated:** May 2026 | **Version:** 1.0

---

## Table of Contents

1. [Important Notice](#important-notice)
2. [Understanding the Architecture](#understanding-the-architecture)
3. [Prerequisites Checklist](#prerequisites-checklist)
4. [Option 1: Docker Desktop (Recommended)](#option-1-docker-desktop)
5. [Option 2: Full Docker Compose](#option-2-full-docker-compose)
6. [Option 3: VPS/Cloud Server](#option-3-vpscloud-server)
7. [Option 4: Kubernetes](#option-4-kubernetes-enterprise)
8. [Service Discovery](#service-discovery)
9. [Testing the Application](#testing-the-application)
10. [Troubleshooting](#troubleshooting)
11. [FAQ](#faq)

---

## Important Notice

### This Project CANNOT Run on cPanel or XAMPP

**cPanel** and **XAMPP** are web hosting control panels designed for traditional LAMP/LEMP stacks (Linux, Apache, MySQL, PHP). They cannot handle the complex requirements of modern microservices architectures.

### Why cPanel/XAMPP Won't Work

| Requirement | cPanel/XAMPP Capability | Azeebo+ Requirement |
|-------------|------------------------|---------------------|
| **Multiple Services** | Single Apache instance | 18+ independent Node.js services |
| **Container Support** | None | Docker containers required |
| **Redis Cache** | No native support | Required for session/state management |
| **PostgreSQL** | Limited (phpPgAdmin) | Primary database (full support) |
| **Node.js Microservices** | No | Core architecture |
| **Kubernetes** | No | Orchestration framework |
| **Service Mesh** | No | Inter-service communication |
| **Background Workers** | Limited cron jobs | BullMQ job queues |
| **WebSocket Support** | Basic | Real-time communication |

### What Happens If You Try?

If you attempt to deploy on cPanel/XAMPP:

1. **No package.json support** - cPanel can't run `pnpm install` or `pnpm dev`
2. **Port conflicts** - All 18 services need different ports (3000-3019)
3. **No Docker** - Can't run `docker-compose up`
4. **No Redis** - Session management will fail
5. **No background jobs** - Payment processing, notifications won't work
6. **No inter-service communication** - Services can't talk to each other

---

## Understanding the Architecture

### Azeebo+ is a Microservices Monorepo

This project uses a **microservices architecture** organized as a **monorepo** using pnpm workspaces.

```
azeebo+/
├── apps/                    # Frontend applications
│   ├── admin/              # Admin dashboard (NestJS)
│   ├── creator-portal/     # Creator management portal (NestJS)
│   ├── mobile/             # React Native mobile app (Expo)
│   └── web/                # Next.js web application
├── services/               # Backend microservices (18 services)
│   ├── auth-service/       # Authentication (port 3000)
│   ├── user-service/       # User management (port 3001)
│   ├── wallet-service/     # Wallet operations (port 3002)
│   ├── payment-service/    # Payment processing (port 3003)
│   ├── content-service/    # Content management (port 3004)
│   ├── media-service/      # Media upload/CDN (port 3019)
│   ├── search-service/     # Content search (port 3005)
│   ├── notification-service/ # Notifications (port 3006)
│   ├── reward-service/     # Loyalty rewards (port 3007)
│   ├── analytics-service/  # Analytics (port 3008)
│   ├── recommendation-service/ # Recommendations (port 3009)
│   ├── support-service/     # Support tickets (port 3010)
│   ├── reality-service/    # Reality TV universe (port 3010)
│   ├── movie-service/      # Movies universe (port 3011)
│   ├── games-service/      # Games universe (port 3012)
│   ├── comedy-service/     # Comedy universe (port 3013)
│   ├── sports-service/     # Sports universe (port 3014)
│   ├── lifestyle-service/  # Lifestyle universe (port 3016)
│   ├── vertical-service/   # Universe management (port 3017)
│   └── creator-service/    # Creator platform (port 3018)
├── packages/               # Shared libraries
│   ├── ui/                 # Design system components
│   ├── shared-types/       # TypeScript types
│   ├── api-client/         # API client SDK
│   └── ...                 # Other shared packages
├── infra/                  # Infrastructure as Code
│   └── k8s/               # Kubernetes configurations
└── docs/                   # Documentation
```

### Service Communication Flow

```
                                    ┌─────────────────────────────────────┐
                                    │           API Gateway               │
                                    │         (Port 3000 /nginx)          │
                                    │                                     │
                                    │  ┌─────────────────────────────┐   │
                                    │  │  Rate Limiting               │   │
                                    │  │  Authentication              │   │
                                    │  │  Request Routing             │   │
                                    │  └─────────────────────────────┘   │
                                    └──────────────┬──────────────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
          ┌─────────▼─────────┐          ┌────────▼─────────┐          ┌────────▼─────────┐
          │   Auth Service   │          │  Wallet Service  │          │  Payment Service │
          │    (Port 3000)   │          │   (Port 3002)   │          │    (Port 3003)   │
          └─────────┬─────────┘          └─────────┬─────────┘          └─────────┬─────────┘
                    │                            │                            │
                    │                            │                            │
          ┌─────────▼─────────┐          ┌────────▼─────────┐          ┌────────▼─────────┐
          │  User Service    │          │     Redis        │          │   PostgreSQL    │
          │   (Port 3001)    │          │   (Port 6379)    │          │   (Port 5432)   │
          └──────────────────┘          └──────────────────┘          └─────────────────┘
```

### Database Schema Overview

The project uses **PostgreSQL** with **Prisma ORM**. Each service has its own schema:

```
PostgreSQL ( azeebo_plus_dev )
│
├── auth_service          # Users, sessions, tokens
├── wallet_service        # Wallets, transactions
├── payment_service       # Payment intents, webhooks
├── content_service       # Content, media, universes
├── notification_service  # Notifications, preferences
├── reward_service        # Points, redemptions
└── ... (other services)
```

---

## Prerequisites Checklist

Before starting, ensure you have:

### For Docker Desktop

| Tool | Version | Purpose | Download |
|------|---------|---------|----------|
| Docker Desktop | 4.0+ | Container runtime | [docker.com](https://www.docker.com/products/docker-desktop) |
| Node.js | 20.x LTS | JavaScript runtime | [nodejs.org](https://nodejs.org/) |
| pnpm | 8.x+ | Package manager | `npm install -g pnpm` |
| Git | Any recent | Version control | [git-scm.com](https://git-scm.com) |

### For VPS Deployment

| Tool | Version | Purpose |
|------|---------|---------|
| Ubuntu | 22.04 LTS | Operating system |
| Docker | 24.x+ | Container runtime |
| Docker Compose | 2.x+ | Container orchestration |
| Nginx | Latest | Reverse proxy |
| Certbot | Latest | SSL certificates |
| SSH | OpenSSH 8.x | Remote access |

### System Requirements

| Resource | Minimum | Recommended |
|----------|---------|------------|
| RAM | 4 GB | 8 GB |
| CPU | 2 cores | 4 cores |
| Disk | 20 GB | 50 GB SSD |
| Docker | 4 GB memory | 8 GB memory allocated |

---

## Option 1: Docker Desktop (Recommended)

This is the **easiest and fastest** way to run Azeebo+ locally. Docker Desktop provides Linux containers on Mac/Windows.

### Step 1.1: Install Docker Desktop

**macOS:**
```bash
# Download from https://www.docker.com/products/docker-desktop
# Or install via Homebrew:
brew install --cask docker
```

**Windows:**
```bash
# Download installer from https://www.docker.com/products/docker-desktop
# Run the installer and follow the wizard
```

**Verify Installation:**
```bash
docker --version
# Docker version 24.x.x

docker-compose --version
# docker-compose version v2.x.x

docker ps
# Should show empty list with no errors
```

### Step 1.2: Configure Docker Desktop Resources

1. Open **Docker Desktop**
2. Go to **Settings** → **Resources**
3. Set **Memory** to at least **4 GB** (8 GB recommended)
4. Set **CPUs** to at least **2** (4 recommended)
5. Set **Swap** to at least **1 GB**
6. Set **Disk image** to at least **20 GB**
7. Click **Apply & Restart**

### Step 1.3: Clone the Repository

```bash
# Open Terminal (macOS) or PowerShell (Windows)

# Navigate to your projects directory
cd ~/Projects

# Clone the repository
git clone https://github.com/your-org/azeebo-plus.git

# Enter the project directory
cd azeebo-plus

# Verify contents
ls -la
```

### Step 1.4: Install Node.js and pnpm

```bash
# Install Node.js 20.x (if not installed)
# macOS:
brew install node@20

# Windows: Download from nodejs.org

# Verify Node.js
node --version
# v20.x.x

# Install pnpm globally
npm install -g pnpm

# Verify pnpm
pnpm --version
# 8.x.x
```

### Step 1.5: Install Project Dependencies

```bash
# From the azeebo-plus directory
pnpm install

# This will install dependencies for ALL workspaces
# Expect it to take 2-5 minutes depending on connection

# Verify installation
pnpm list --depth 0
```

### Step 1.6: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Open the .env file in a text editor
nano .env  # Linux/macOS
# or
notepad .env  # Windows
```

**Required Environment Variables:**

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================

# PostgreSQL connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/azeebo_plus_dev

# ============================================
# REDIS CONFIGURATION
# ============================================

# Redis connection string (used for caching & sessions)
# Format: redis://HOST:PORT
REDIS_URL=redis://localhost:6379

# ============================================
# AUTHENTICATION
# ============================================

# JWT Secret Key (minimum 32 characters)
# Generate with: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# JWT Access Token Expiration
JWT_EXPIRES_IN=30m

# JWT Refresh Token Expiration  
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# APPLICATION SETTINGS
# ============================================

# Node environment
NODE_ENV=development

# API Gateway URL
API_GATEWAY_URL=http://localhost:3000

# Frontend URLs (comma-separated for CORS)
ALLOWED_ORIGINS=http://localhost:4000,http://localhost:19000,http://localhost:19001

# ============================================
# PAYMENT PROVIDERS (Optional for testing)
# ============================================

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_paystack_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_key
PAYSTACK_WEBHOOK_SECRET=whsec_your_webhook_secret

# ============================================
# EMAIL CONFIGURATION (Optional)
# ============================================

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-email-password
SMTP_FROM=noreply@azeebo.com
```

### Step 1.7: Start Infrastructure Services

```bash
# Start only PostgreSQL and Redis (the foundation services)
docker-compose up -d postgres redis

# Expected output:
# Creating network "azeebo-plus_azeebo_network" ... done
# Creating azeebo-plus_postgres_1 ... done
# Creating azeebo-plus_redis_1 ... done

# Wait for services to be healthy (30-60 seconds)
docker-compose ps

# Should show:
# NAME                COMMAND                  SERVICE   STATUS
# azeebo_postgres      "docker-entrypoint.s…"   postgres  Up (healthy)
# azeebo_redis        "docker-entrypoint.s…"   redis     Up (healthy)
```

### Step 1.8: Initialize the Database

```bash
# Generate Prisma clients for ALL services
# This reads each service's schema.prisma and creates TypeScript types
pnpm -r exec prisma generate

# Expected output (each service):
# Prisma client generated for auth-service
# Prisma client generated for user-service
# ... etc

# Run database migrations (create tables)
pnpm -r exec prisma migrate deploy

# Expected output:
# Applying migration for auth-service... 
# Migration 20260101_create_auth_schema applied
# Applying migration for user-service...
# ... etc
```

### Step 1.9: Start Development Services

```bash
# Start all services in development mode
# This runs each service with hot-reload enabled
pnpm dev

# Expected output:
# Started dev server for auth-service on port 3000
# Started dev server for user-service on port 3001
# Started dev server for wallet-service on port 3002
# ... (18 services total)
# 
# API Gateway ready at http://localhost:3000
# Web App ready at http://localhost:4000
```

### Step 1.10: Verify Services are Running

**Option A: Check with curl**
```bash
# API Gateway health check
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","services":{"auth":"up","user":"up","wallet":"up",...}}

# Check specific service
curl http://localhost:3001/health  # User service
curl http://localhost:3002/health  # Wallet service
```

**Option B: Check with Docker**
```bash
docker-compose ps

# Expected output:
# NAME                COMMAND                  SERVICE   STATUS
# azeebo_postgres     "docker-entrypoint.s…"   postgres  Up (healthy)
# azeebo_redis        "docker-entrypoint.s…"   redis     Up (healthy)
# azeebo_auth_1       "node start"              auth      Up
# azeebo_user_1       "node start"              user      Up
# ... (more services)
```

**Option C: Check with pnpm**
```bash
# List running services
pnpm list --filter "@azeebo/auth-service"

# Check process manager output
# Services are running in terminal where you ran pnpm dev
```

### Step 1.11: Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | http://localhost:4000 | Next.js frontend |
| **Admin Panel** | http://localhost:3000/admin | Admin dashboard |
| **API Gateway** | http://localhost:3000 | Main API entry |
| **Swagger Docs** | http://localhost:3000/docs | API documentation |
| **Auth Service** | http://localhost:3001 | Auth API direct |
| **User Service** | http://localhost:3002 | User API direct |

### Step 1.12: Stop the Services

```bash
# Stop all running services
# Press Ctrl+C in the terminal running pnpm dev

# OR stop and remove containers
docker-compose down

# Stop and remove containers AND volumes (clean slate)
docker-compose down -v
```

---

## Option 2: Full Docker Compose

This approach runs **everything in Docker containers**, simulating a production environment. Great for testing production-like behavior on your local machine.

### Step 2.1: Prerequisites

Same as Option 1, plus:
- 8GB+ RAM allocated to Docker Desktop
- 30GB+ disk space

### Step 2.2: Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit for production-like settings
nano .env
```

**Production-Ready .env Settings:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:strong_password@postgres:5432/azeebo_plus_prod
REDIS_URL=redis://redis:6379
JWT_SECRET=production-secret-key-minimum-32-characters-long-here
ALLOWED_ORIGINS=https://your-domain.com
```

### Step 2.3: Build Docker Images

```bash
# Build all service images
# This takes 5-15 minutes first time
docker-compose build

# Expected output:
# Building auth-service...
# Step 1/10 : FROM node:20-alpine
# ...
# Successfully built abc123def456
# Building user-service...
# ...
```

### Step 2.4: Start All Services

```bash
# Start all containers in detached mode
docker-compose up -d

# OR view logs while starting
docker-compose up

# This starts:
# - PostgreSQL (postgres)
# - Redis (redis)
# - auth-service
# - user-service
# - wallet-service
# - payment-service
# - content-service
# - ... (all 18 services)
# - nginx (API Gateway)
# - web-app
```

### Step 2.5: Monitor Service Health

```bash
# View all running containers
docker-compose ps

# Follow logs for a specific service
docker-compose logs -f auth-service

# Follow logs for all services
docker-compose logs -f

# Check resource usage
docker stats
```

### Step 2.6: Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Web App** | http://localhost:4000 | None (register first) |
| **API Gateway** | http://localhost:3000 | JWT token |
| **Swagger Docs** | http://localhost:3000/docs | Click "Authorize" |
| **Prometheus** | http://localhost:9090 | None |
| **Grafana** | http://localhost:3001 | admin/admin |

### Step 2.7: Stop Services

```bash
# Stop all services (keep data volumes)
docker-compose stop

# Stop and remove containers (keep volumes)
docker-compose down

# Stop and remove EVERYTHING (full clean)
docker-compose down -v --rmi all
```

---

## Option 3: VPS/Cloud Server

For deploying a production-like environment on a cloud server (AWS EC2, DigitalOcean, Linode, etc.).

### Step 3.1: Choose a VPS Provider

| Provider | Recommended Instance | Notes |
|---------|---------------------|-------|
| AWS EC2 | t3.medium (2 vCPU, 4GB) | Free tier available |
| DigitalOcean | droplet (4GB, 2 vCPU) | $24/month |
| Linode | Linode 4GB | $24/month |
| Vultr | 4GB, 2 vCPU | $24/month |

### Step 3.2: Server Setup

SSH into your server and run:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable Docker
sudo systemctl enable docker

# Add user to docker group (avoid sudo for docker commands)
sudo usermod -aG docker $USER

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Verify installations
docker --version
node --version
pnpm --version
```

### Step 3.3: Configure Firewall

```bash
# Enable UFW firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable

# Verify firewall status
sudo ufw status verbose
```

### Step 3.4: Clone and Configure

```bash
# Exit and re-login to apply group changes, then:
# Clone repository
git clone https://github.com/your-org/azeebo-plus.git
cd azeebo-plus

# Copy environment file
cp .env.example .env

# Edit with production values
nano .env
```

### Step 3.5: Start Services

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 3.6: Configure Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/azeebo
```

**Nginx Configuration File:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    # Redirect to HTTPS (uncomment after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket support (for real-time features)
    location /socket.io {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/azeebo /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 3.7: Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is enabled by default
# Verify with: sudo certbot renew --dry-run
```

### Step 3.8: Setup Domain DNS

Point your domain's DNS to your server:

| Record Type | Name | Value |
|-------------|------|-------|
| A | @ | your-server-ip |
| A | www | your-server-ip |
| CNAME | * | your-domain.com |

### Step 3.9: Access Your Deployment

After DNS propagates (can take up to 24 hours):
- **Web App**: https://your-domain.com
- **API**: https://your-domain.com (port 3000)
- **Swagger Docs**: https://your-domain.com/docs

---

## Option 4: Kubernetes (Enterprise)

For large-scale production deployments using Kubernetes.

### Step 4.1: Prerequisites

- Kubernetes cluster (EKS, GKE, DigitalOcean Kubernetes, or minikube for local)
- kubectl installed and configured
- Helm 3.x (optional but recommended)

### Step 4.2: Apply Kubernetes Manifests

```bash
# Apply base configurations
kubectl apply -f infra/k8s/base/

# Check pods status
kubectl get pods -n azeebo

# View services
kubectl get svc -n azeebo
```

### Step 4.3: Configure Ingress

```bash
# Apply ingress configuration
kubectl apply -f infra/k8s/base/ingress.yaml

# Check ingress
kubectl get ingress -n azeebo
```

### Step 4.4: Set Up Monitoring

```bash
# Apply monitoring stack (Prometheus + Grafana)
kubectl apply -f infra/k8s/monitoring/

# Access Grafana
kubectl port-forward -n monitoring svc/grafana 3001:3000
# Then open http://localhost:3001
```

---

## Service Discovery

### All Services and Their Ports

| Service | Internal Port | External Port | Route |
|---------|---------------|---------------|-------|
| API Gateway (nginx) | 3000 | 3000 | / |
| Auth Service | 3000 | 3001 | /auth |
| User Service | 3001 | 3002 | /users |
| Wallet Service | 3002 | 3003 | /wallet |
| Payment Service | 3003 | 3004 | /payment |
| Content Service | 3004 | 3005 | /content |
| Media Service | 3019 | 3020 | /media |
| Search Service | 3005 | 3006 | /search |
| Notification Service | 3006 | 3007 | /notifications |
| Reward Service | 3007 | 3008 | /rewards |
| Analytics Service | 3008 | 3009 | /analytics |
| Recommendation Service | 3009 | 3010 | /recommendation |
| Support Service | 3010 | 3011 | /support |
| Reality Service | 3010 | 3012 | /reality |
| Movie Service | 3011 | 3013 | /movies |
| Games Service | 3012 | 3014 | /games |
| Comedy Service | 3013 | 3015 | /comedy |
| Sports Service | 3014 | 3016 | /sports |
| Lifestyle Service | 3016 | 3017 | /lifestyle |
| Vertical Service | 3017 | 3018 | /vertical |
| Creator Service | 3018 | 3019 | /creators |

### Service Communication

Services communicate via:
1. **HTTP/REST** - Synchronous calls through API Gateway
2. **Redis Pub/Sub** - Real-time events
3. **BullMQ** - Asynchronous job processing

---

## Testing the Application

### Run All Tests

```bash
# From project root
pnpm test

# Run with coverage
pnpm test:cov
```

### Run Tests by Type

```bash
# Unit tests only
pnpm run test:unit

# Integration tests (requires database)
pnpm run test:integration

# E2E tests
pnpm run test:e2e

# Contract tests
pnpm run test:contract
```

### Test Individual Service

```bash
# Test auth-service only
pnpm --filter auth-service test

# Test payment-service only
pnpm --filter payment-service test
```

### Manual API Testing

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Register User:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "name": "Test User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

**View Swagger Docs:**
Open http://localhost:3000/docs in your browser.

---

## Troubleshooting

### Docker Issues

#### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# OR change the port in docker-compose.yml
```

#### Docker Out of Memory

```bash
# Open Docker Desktop Settings
# Resources → Memory → Set to 8GB
# Apply & Restart
```

#### Cannot Connect to Docker

```bash
# Restart Docker Desktop
# macOS:
killall Docker
open -a Docker

# Linux:
sudo systemctl restart docker
```

### Database Issues

#### PostgreSQL Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Reset PostgreSQL
docker-compose down -v postgres
docker-compose up -d postgres

# Wait 30 seconds, then run migrations
pnpm -r exec prisma migrate deploy
```

#### Migration Failed

```bash
# Check migration status
docker-compose logs postgres | grep migration

# Reset migrations (WARNING: data loss)
docker-compose down -v
rm -rf services/*/prisma/migrations
pnpm -r exec prisma migrate dev
```

#### Prisma Client Outdated

```bash
# Regenerate Prisma clients
pnpm -r exec prisma generate
```

### Redis Issues

#### Redis Connection Failed

```bash
# Check Redis status
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping

# Expected: PONG

# Restart Redis
docker-compose restart redis
```

### Application Issues

#### Service Won't Start

```bash
# Check logs
docker-compose logs <service-name>

# Common fixes:
# 1. Rebuild image
docker-compose build <service-name>
docker-compose up -d <service-name>

# 2. Clear node_modules and reinstall
rm -rf services/<service>/node_modules
pnpm install
```

#### 502 Bad Gateway

```bash
# Usually means a backend service is down
docker-compose ps

# Check specific service logs
docker-compose logs auth-service

# Restart the failing service
docker-compose restart auth-service
```

#### CORS Errors

```bash
# Check ALLOWED_ORIGINS in .env
# Must include the frontend URL

# Example for React Native Expo:
ALLOWED_ORIGINS=http://localhost:19000,http://localhost:19001

# Example for web:
ALLOWED_ORIGINS=http://localhost:4000

# Then restart services
docker-compose down
docker-compose up -d
```

### Network Issues

#### Cannot Access localhost

```bash
# Try using 127.0.0.1 instead of localhost
curl http://127.0.0.1:3000/health

# Check if Docker is running on correct network
docker network ls
docker network inspect azeebo-plus_azeebo_network
```

---

## FAQ

### Q: Can I run only some services?

**A:** Yes, but the application may not work fully. To run specific services:

```bash
# Start only auth and user services
docker-compose up -d postgres redis auth-service user-service
```

### Q: How do I reset the database?

**A:** WARNING: This deletes all data!

```bash
# Stop everything
docker-compose down -v

# Remove migrations
rm -rf services/*/prisma/migrations

# Start fresh
docker-compose up -d postgres redis
pnpm -r exec prisma migrate dev
```

### Q: How do I add a new service?

**A:** See `docs/engineering/modules-migration.md` for detailed guide.

### Q: Can I use MySQL instead of PostgreSQL?

**A:** No. PostgreSQL is required for:
- Advanced JSON operations
- Full-text search
- Array data types
- Row-level security

### Q: How do I update to the latest code?

```bash
git pull origin main
docker-compose build
docker-compose up -d
```

### Q: How do I backup the database?

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres azeebo_plus_dev > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres azeebo_plus_dev < backup.sql
```

### Q: Why are tests failing?

**A:** Common causes:
1. Database not running - `docker-compose up -d postgres redis`
2. Environment variables missing - Check `.env` file
3. Node modules outdated - `pnpm install`
4. Prisma client outdated - `pnpm -r exec prisma generate`

---

## Summary

| Environment | Works? | Complexity | Best For |
|-------------|--------|------------|----------|
| cPanel | ❌ No | N/A | N/A |
| XAMPP | ❌ No | N/A | N/A |
| Docker Desktop | ✅ Yes | Easy | Local development |
| Full Docker Compose | ✅ Yes | Medium | Testing production-like |
| VPS/Cloud | ✅ Yes | Medium | Small deployments |
| Kubernetes | ✅ Yes | Hard | Enterprise/production |

**Recommended for most users:** Docker Desktop (Option 1)

---

## Need Help?

1. Check `docs/` for detailed documentation
2. Check `docs/RUNBOOKS.md` for deployment runbooks
3. Check `docs/QA_TESTING_PLAN.md` for testing procedures
4. Review `.trae/rules/` for engineering standards
