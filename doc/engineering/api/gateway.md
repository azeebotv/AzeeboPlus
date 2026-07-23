# API Gateway — Reference

> Port: 3013 | Database: None (stateless)

## Purpose
Request routing, JWT validation, rate limiting, CORS, health aggregation.

## Routes To
All 27 backend services.

## Key Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness check |
| GET | /live | Liveness check |
| * | /api/v1/* | Proxied to backend services |

## Configuration
- JWT validation on every request
- Rate limiting: 1000 req/min general, 10 req/min auth, 20 req/min payment
- CORS for production domains
- Circuit breaker pattern with 5s timeout
- Internal API key validation for service-to-service calls

## Environment Variables
| Variable | Description |
|----------|-------------|
| PORT | Gateway port (default: 3013) |
| JWT_ACCESS_SECRET | JWT validation secret |
| GATEWAY_SECRET | Inter-service authentication |
| INTERNAL_API_KEY | Internal API key |
| CORS_ORIGINS | Allowed origins |
