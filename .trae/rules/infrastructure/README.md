# Azeebo+ Infrastructure Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Overview

This directory contains infrastructure-related steering documents for the Azeebo+ platform.

---

## Documents

| File | Description |
|------|-------------|
| [terraform.md](./terraform.md) | Terraform standards and best practices |
| [docker.md](./docker.md) | Docker standards and best practices |
| [kubernetes.md](./kubernetes.md) | Kubernetes standards and best practices |
| [cicd.md](./cicd.md) | CI/CD pipeline standards |
| [monitoring.md](./monitoring.md) | Infrastructure monitoring standards |
| [networking.md](./networking.md) | Networking standards |
| [storage.md](./storage.md) | Storage standards |

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Cloud Provider | AWS (primary), GCP (backup) |
| IaC | Terraform |
| Containerization | Docker |
| Orchestration | Kubernetes |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| Logging | Loki + Elasticsearch |
| Tracing | Jaeger |

---

## Environment Strategy

| Environment | Purpose | Access |
|-------------|---------|--------|
| Development | Local testing | Developers |
| Staging | Pre-production QA | QA + Developers |
| Production | Live users | Restricted |

---

## Prohibited Actions

- No hardcoded credentials
- No direct database access from outside
- No public storage buckets
- No bypassing CI/CD pipeline
- No manual production changes