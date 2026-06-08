# Secrets Management Guide

## Overview

This document describes how to manage secrets and environment variables for the Azeebo+ platform across different environments.

## Environment Files

### Development
- **File**: `.env` (root directory)
- **Purpose**: Local development with mock/test credentials
- **Security**: Contains mock values only - NEVER commit real credentials

### Production
- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- Inject secrets at runtime via environment variables

## Required Environment Variables

### Critical Security Variables (MUST be set)

```bash
# JWT Secrets - Generate with: openssl rand -base64 64
JWT_SECRET=<min-32-chars>
JWT_ACCESS_SECRET=<min-32-chars>
JWT_REFRESH_SECRET=<min-32-chars>

# CORS Origins - Comma-separated list of allowed origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Database Configuration

```bash
# Master PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=azeebo_plus_dev

# Per-service passwords (22 services)
AUTH_DB_PASSWORD=<secure-password>
USER_DB_PASSWORD=<secure-password>
WALLET_DB_PASSWORD=<secure-password>
# ... (see .env.example for complete list)
```

### Payment Providers

```bash
# Paystack
PAYSTACK_SECRET_KEY=sk_live_<your-key>
PAYSTACK_PUBLIC_KEY=pk_live_<your-key>

# Flutterwave
FLUTTERWAVE_SECRET_KEY=FLWSECK_<your-key>
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_<your-key>
```

### Notification Providers

```bash
# SendGrid
SENDGRID_API_KEY=SG.<your-key>
SENDGRID_FROM_EMAIL=no-reply@azeebo.com

# Twilio
TWILIO_ACCOUNT_SID=AC<your-sid>
TWILIO_AUTH_TOKEN=<your-token>

# Firebase
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### AWS / S3

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_S3_BUCKET=<your-bucket>
```

## Secrets Management Solutions

### Option 1: AWS Secrets Manager

```bash
# Store a secret
aws secretsmanager create-secret \
  --name azeebo/production/jwt-secret \
  --secret-string "your-secret-value"

# Retrieve a secret
aws secretsmanager get-secret-value \
  --secret-id azeebo/production/jwt-secret \
  --query 'SecretString' --output text
```

#### Integration with ECS/Fargate
```json
{
  "secrets": [
    {
      "name": "JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:region:account:secret:azeebo/production/jwt-secret"
    }
  ]
}
```

### Option 2: HashiCorp Vault

```bash
# Store a secret
vault kv put secret/azeebo/production \
  jwt_secret="your-secret-value" \
  auth_db_password="auth-password"

# Retrieve a secret
vault kv get -field=jwt_secret secret/azeebo/production
```

#### Integration with Kubernetes
```yaml
apiVersion: secrets.hashicorp.com/v1beta1
kind: VaultAuth
metadata:
  name: azeebo-auth
spec:
  method: kubernetes
  mount: kubernetes
  kubernetes:
    role: azeebo
    serviceAccount: azeebo-sa
```

### Option 3: Docker Secrets (Swarm)

```bash
# Create a secret
echo "your-secret-value" | docker secret create jwt_secret -

# Use in docker-compose.yml
services:
  auth-service:
    secrets:
      - jwt_secret
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret

secrets:
  jwt_secret:
    external: true
```

### Option 4: Kubernetes Secrets

```bash
# Create a secret
kubectl create secret generic azeebo-secrets \
  --from-literal=jwt-secret=your-secret-value \
  --from-literal=auth-db-password=auth-password

# Use in deployment
env:
  - name: JWT_SECRET
    valueFrom:
      secretKeyRef:
        name: azeebo-secrets
        key: jwt-secret
```

## Secret Rotation

### Automated Rotation Script

```bash
#!/bin/bash
# rotate-secrets.sh

# Generate new JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 64)

# Update in secrets manager
aws secretsmanager update-secret \
  --secret-id azeebo/production/jwt-secret \
  --secret-string "$NEW_JWT_SECRET"

# Trigger deployment to pick up new secret
aws ecs update-service \
  --cluster azeebo-cluster \
  --service auth-service \
  --force-new-deployment
```

### Rotation Schedule

| Secret Type | Rotation Period | Priority |
|------------|-----------------|----------|
| JWT Secrets | 90 days | Critical |
| Database Passwords | 180 days | High |
| API Keys | 365 days | Medium |
| Session Secrets | 90 days | Critical |

## PgBouncer Userlist

The PgBouncer userlist is generated from environment variables:

```bash
# Generate userlist
./infra/scripts/generate-pgbouncer-userlist.sh

# Output: infra/config/pgbouncer_userlist.txt
# Format: "username" "password"
```

**Never commit the generated userlist file** - it's in `.gitignore`.

## Environment Validation

The application validates required environment variables at startup:

```typescript
// packages/shared-types/src/env-validation.ts
const requiredVars = [
  'JWT_SECRET',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'ALLOWED_ORIGINS',
];

// Throws error if any required variable is missing
```

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use different secrets** for each environment (dev, staging, production)
3. **Rotate secrets regularly** according to the schedule above
4. **Audit secret access** - log who accesses secrets and when
5. **Use least privilege** - only grant access to secrets that are needed
6. **Encrypt at rest** - ensure secrets are encrypted in storage
7. **Encrypt in transit** - use TLS for all secret transfers

## Troubleshooting

### "ALLOWED_ORIGINS environment variable must be set"

This error occurs when starting a service without the required CORS configuration:

```bash
# Fix: Set the environment variable
export ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Or add to .env file
echo "ALLOWED_ORIGINS=http://localhost:3000" >> .env
```

### "JWT_SECRET environment variable must be set"

Generate a secure secret:

```bash
# Generate a 64-character secret
openssl rand -base64 64

# Add to .env
echo "JWT_SECRET=$(openssl rand -base64 64)" >> .env
```

### Database Connection Failures

Check that database passwords match between:
1. PostgreSQL user passwords
2. PgBouncer userlist
3. Service environment variables

```bash
# Regenerate PgBouncer userlist
./infra/scripts/generate-pgbouncer-userlist.sh
```

## Production Checklist

- [ ] All secrets stored in secrets manager (not in .env files)
- [ ] JWT secrets are at least 32 characters
- [ ] CORS origins restricted to production domains
- [ ] Database passwords are strong and unique
- [ ] API keys are production keys (not test keys)
- [ ] Secret rotation is configured
- [ ] Access logging is enabled
- [ ] TLS is enabled for all connections
