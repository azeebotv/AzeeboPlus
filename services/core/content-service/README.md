# Azeebo+ Content Service

## Overview

The Content Service manages all content operations for the Azeebo+ platform. It handles content creation, retrieval, and management.

## Features

- **Content Management**: Create, update, and delete content
- **Content Delivery**: Serve content to users
- **Caching**: Redis caching for performance
- **Search Integration**: Full-text search support
- **Analytics**: Content performance tracking

## Technology Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Search**: Elasticsearch

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis
- Elasticsearch (optional)

### Installation

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

### Running the Service

```bash
npm run start:dev
```

## API Endpoints

### Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /content | List content |
| GET | /content/:id | Get content details |
| POST | /content | Create content (creators) |
| PATCH | /content/:id | Update content |
| DELETE | /content/:id | Delete content |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /content/:id/analytics | Get content analytics |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /content/:id/comments | Get comments |
| POST | /content/:id/comments | Add comment |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness probe |
| GET | /live | Liveness probe |

## Configuration

```bash
PORT=3015
DATABASE_URL="postgresql://user:password@localhost:5432/content"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret"
```

## Security

- Creator authorization for content management
- Rate limiting on public endpoints
- Content sanitization
- Secure media handling

## Testing

```bash
npm test
```

**Last Updated:** 2026-05-19
