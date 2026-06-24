# Reality Service

Azeebo+ Reality Service - Manages reality TV shows, voting, contestants, and user interactions.

## Features

- **Reality Shows**: Manage reality TV show content and metadata
- **Show Episodes**: Track and manage episodes with air times
- **Contestants**: Manage contestant profiles and status
- **Voting System**: Real-time voting with supervote support
- **Predictions**: User predictions on show outcomes
- **User Interactions**: Likes, comments, and shares on shows
- **Premium Extras**: Bonus content and exclusive features
- **Real-time Updates**: WebSocket support for live events

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Reality Service                          │
├─────────────────────────────────────────────────────────────┤
│  Modules:                                                  │
│    ├── shows         # Show management                     │
│    ├── episodes      # Episode scheduling                  │
│    ├── contestants   # Contestant profiles                │
│    ├── votes         # Voting & supervote logic           │
│    ├── predictions   # Prediction markets                 │
│    └── analytics     # Voting analytics                   │
├─────────────────────────────────────────────────────────────┤
│  Dependencies:                                             │
│    ├── Wallet Service    # For vote purchases             │
│    ├── Analytics Service # For event tracking             │
│    ├── Auth Service      # For authentication             │
│    └── Redis             # For caching & real-time        │
└─────────────────────────────────────────────────────────────┘
```

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3014 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |
| REDIS_URL | redis://localhost:6379 | Redis connection for caching |
| JWT_SECRET | - | JWT signing secret |
| WALLET_SERVICE_URL | http://localhost:3002 | Wallet service URL |
| ANALYTICS_SERVICE_URL | http://localhost:3008 | Analytics service URL |
| AUTH_SERVICE_URL | http://localhost:3000 | Auth service URL |

## Getting Started

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Start development server
pnpm start:dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## API Routes

### Shows
- `GET /v1/reality/shows` - List reality shows
- `GET /v1/reality/shows/:id` - Get show details
- `POST /v1/reality/shows` - Create show (admin)
- `PUT /v1/reality/shows/:id` - Update show (admin)
- `DELETE /v1/reality/shows/:id` - Delete show (admin)

### Episodes
- `GET /v1/reality/shows/:showId/episodes` - List episodes
- `GET /v1/reality/episodes/:id` - Get episode details
- `POST /v1/reality/shows/:showId/episodes` - Create episode (admin)

### Contestants
- `GET /v1/reality/shows/:showId/contestants` - List contestants
- `GET /v1/reality/contestants/:id` - Get contestant details
- `POST /v1/reality/shows/:showId/contestants` - Add contestant (admin)
- `PUT /v1/reality/contestants/:id` - Update contestant (admin)

### Voting
- `POST /v1/reality/votes` - Submit vote
- `POST /v1/reality/supervotes` - Submit supervote
- `GET /v1/reality/shows/:showId/votes` - Get vote counts
- `GET /v1/reality/users/:userId/votes` - Get user voting history

### Predictions
- `POST /v1/reality/predictions` - Make prediction
- `GET /v1/reality/shows/:showId/predictions` - List predictions
- `GET /v1/reality/users/:userId/predictions` - User predictions

## API Documentation

- **Swagger UI**: `http://localhost:3014/api`
- **OpenAPI Spec**: `http://localhost:3014/api-json`

## Deployment

### Kubernetes Deployment

```bash
# Deploy to Kubernetes
kubectl apply -f infra/k8s/reality-service/deployment.yaml

# Check status
kubectl get pods -n azeebo -l app=reality-service

# View logs
kubectl logs -n azeebo -l app=reality-service -f
```

### Health Checks

- **Health**: `GET /health` - Service health status
- **Ready**: `GET /ready` - Readiness probe
- **Live**: `GET /live` - Liveness probe

## Security

- **JWT Authentication**: All endpoints require valid JWT token
- **Rate Limiting**: 100 requests/minute per IP
- **Input Validation**: All inputs validated with class-validator
- **Transaction Integrity**: Votes processed within database transactions

## Ownership

- **Team**: Entertainment Engineering
- **Maintainer**: entertainment@azeeboplus.com
- **Last Updated**: 2026-05-15
