# Azeebo+ Monorepo

A modular entertainment platform supporting multiple universes inside one shared app shell.

## Overview

Azeebo+ is a digital entertainment platform that supports multiple content universes:

1. **Reality** - Reality shows, voting, predictions
2. **Creator** - Creator discovery, uploads, earnings
3. **Lifestyle** - Youth culture, events, nightlife
4. **Vertical** - Premium storyworld, lore, characters
5. **Movie** - Digital cinema, rentals, premieres
6. **Games** - Challenges, trivia, tournaments
7. **Comedy** - Viral skits, stand-up clips
8. **Sports** - Predictions, highlights, fan boards

## Tech Stack

### Frontend
- **Mobile**: React Native + Expo
- **Web**: Next.js
- **Admin**: Next.js

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL + Prisma
- **Cache**: Redis
- **Search**: OpenSearch

### Infrastructure
- **Cloud**: AWS
- **Container**: Docker
- **Orchestration**: Kubernetes
- **IaC**: Terraform

## Project Structure

```
azeebo-plus/
├── .kiro/                      # Kiro configuration and steering
│   └── steering/              # Steering files
│       ├── backend/           # Backend guidelines
│       ├── admin/             # Admin panel guidelines
│       └── apps/              # Frontend applications
│           ├── mobile/        # Mobile app guidelines
│           └── web/           # Web app guidelines
├── services/                   # Shared backend services
│   ├── api-gateway/           # API gateway & routing
│   ├── auth-service/          # Authentication service
│   ├── user-service/          # User management service
│   ├── wallet-service/        # Wallet & balance service
│   ├── payment-service/       # Payment processing service
│   ├── reward-service/        # Rewards & loyalty service
│   ├── notification-service/  # Notification service
│   ├── content-service/       # Content management service
│   ├── search-service/        # Search service
│   ├── analytics-service/     # Analytics service
│   ├── moderation-service/    # Moderation service
│   └── recommendation-service/# Recommendation service
├── modules/                    # Universe-specific services
│   ├── reality-service/       # Reality universe logic
│   ├── creator-service/       # Creator universe logic
│   ├── lifestyle-service/     # Lifestyle universe logic
│   ├── vertical-service/      # Vertical universe logic
│   ├── movie-service/         # Movie universe logic
│   ├── games-service/         # Games universe logic
│   ├── comedy-service/        # Comedy universe logic
│   └── sports-service/        # Sports universe logic
├── apps/                       # Frontend applications
│   ├── mobile/                # React Native mobile app
│   ├── web/                   # Next.js web app
│   ├── admin/                 # Next.js admin panel
│   └── creator-portal/        # Next.js creator portal
├── packages/                   # Shared packages
│   ├── ui/                    # Shared UI components
│   ├── design-tokens/         # Design tokens
│   ├── api-client/            # Shared API client
│   ├── shared-types/          # TypeScript types
│   ├── utils/                 # Utility functions
│   └── analytics-sdk/         # Analytics instrumentation
└── infra/                      # Infrastructure code
    ├── docker/                # Docker configurations
    ├── kubernetes/            # Kubernetes manifests
    ├── terraform/             # Terraform configurations
    └── ci-cd/                 # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker & Docker Compose
- PostgreSQL (14+)
- Redis (7+)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd azeebo-plus

# Install dependencies
pnpm install

# Start development environment
pnpm dev

# Build services
pnpm build

# Run tests
pnpm test
```

## Development

### Running Services

Each service can be run independently:

```bash
cd services/auth-service
pnpm start:dev
```

### Database Migrations

```bash
cd services/auth-service
pnpm prisma:migrate
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run linting
pnpm lint
```

## Services

### Backend Services

| Service | Port | Description |
|---------|------|-------------|
| Auth Service | 3001 | Authentication & JWT |
| User Service | 3002 | User profiles & preferences |
| Wallet Service | 3003 | Wallet & balance management |
| Payment Service | 3004 | Payment processing |
| Content Service | 3005 | Content management |
| Notification Service | 3006 | Push, email, SMS |
| Reward Service | 3007 | Points, badges, streaks |
| Search Service | 3008 | Universal search |
| Analytics Service | 3009 | Event tracking |
| Moderation Service | 3010 | Content moderation |
| Recommendation Service | 3011 | Personalization |
| API Gateway | 3012 | API routing & auth |

### Universe Services

| Service | Description |
|---------|-------------|
| Reality Service | Reality shows, voting, predictions |
| Creator Service | Creator onboarding, uploads, earnings |
| Lifestyle Service | Culture, events, nightlife |
| Vertical Service | Storyworld, lore, characters |
| Movie Service | Digital cinema, rentals, premieres |
| Games Service | Challenges, trivia, tournaments |
| Comedy Service | Viral skits, stand-up clips |
| Sports Service | Predictions, highlights, fan boards |

## API Documentation

Each service includes Swagger documentation:

```bash
# Start a service
cd services/auth-service
pnpm start:dev

# Visit documentation
open http://localhost:3001/docs
```

## Docker

### Start Development Environment

```bash
docker-compose up -d
```

### Stop Development Environment

```bash
docker-compose down
```

### View Logs

```bash
docker-compose logs -f
```

## Infrastructure

### Terraform

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

### Kubernetes

```bash
kubectl apply -f infra/kubernetes/
```

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Make your changes
3. Run tests (`pnpm test`)
4. Run linting (`pnpm lint`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Documentation

- [API Documentation](./docs/api.md)
- [Architecture](./docs/architecture.md)
- [Deployment](./docs/deployment.md)
- [Developer Guide](./docs/developer-guide.md)

## License

MIT