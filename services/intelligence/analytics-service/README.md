# Azeebo+ Analytics Service

## Overview

The Analytics Service is responsible for collecting, processing, and analyzing user behavior data across the Azeebo+ platform. It provides insights into user engagement, content performance, and business metrics.

## Features

- **Event Tracking**: Track user interactions and events
- **Real-time Analytics**: Real-time dashboards and metrics
- **Funnel Analysis**: User journey and conversion funnel tracking
- **Cohort Analysis**: User retention and cohort-based insights
- **KPIs**: Universe-specific key performance indicators
- **Prometheus Metrics**: Built-in monitoring and observability

## Technology Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Metrics**: Prometheus
- **API Docs**: Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 15+
- Redis (optional, for caching)

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm run prisma:generate

# Run migrations
pnpm run prisma:migrate
```

### Running the Service

```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run build
pnpm start
```

## API Endpoints

### Event Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /analytics/events | Track analytics events |
| POST | /analytics/events/batch | Track multiple events |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /analytics/kpis | Get universe KPIs |
| GET | /analytics/realtime | Get real-time stats |
| GET | /analytics/funnels | Get funnel analytics |
| GET | /analytics/cohorts | Get cohort analytics |

### Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /metrics | Prometheus metrics endpoint |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness probe |
| GET | /live | Liveness probe |

## Configuration

### Environment Variables

```bash
# Server
PORT=3008

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/analytics"

# JWT
JWT_SECRET="your-secret-key"

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

## Event Types

The service tracks the following event types:

- `screen_view`: User views a screen
- `content_impression`: Content is displayed
- `content_click`: User clicks on content
- `play_start`: Video playback starts
- `play_complete`: Video playback completes
- `login`: User login attempt
- `signup`: User registration
- `payment_initiated`: Payment started
- `payment_success`: Payment completed
- `reward_earned`: Reward points earned
- `reward_redeemed`: Reward points redeemed
- `vote_submitted`: Vote submitted
- `share`: Content shared

## Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
ppnpm test:cov

# Run tests in watch mode
pnpm test:watch
```

## Deployment

### Docker

```bash
# Build Docker image
docker build -t azeebo/analytics-service .

# Run Docker container
docker run -p 3008:3008 azeebo/analytics-service
```

### Kubernetes

See `infra/k8s/analytics-service.yaml` for Kubernetes deployment configuration.

## Monitoring

The service exposes Prometheus metrics at `/metrics`. Key metrics include:

- `analytics_events_total`: Total events processed
- `analytics_requests_total`: Total API requests
- `analytics_request_duration_seconds`: Request duration histogram
- `analytics_errors_total`: Total errors

## Security

- All endpoints require JWT authentication unless specified otherwise
- Input validation using class-validator
- Rate limiting on all endpoints
- HTTPS required in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is proprietary and confidential.

**Last Updated:** 2026-05-19
