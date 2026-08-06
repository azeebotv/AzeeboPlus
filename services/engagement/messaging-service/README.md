# Messaging Service

Azeebo+ Messaging Service - Handles in-app conversations and direct messaging between users.

## Features

- **Conversations**: Create and manage 1:1 and group conversations
- **Messages**: Send, receive, and read messages with pagination
- **Read Receipts**: Track message read status
- **Message Retention**: Configurable retention policy for message history
- **WebSocket**: Real-time messaging via WebSocket connection

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3024 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |
| REDIS_URL | - | Redis connection string |
| WEBSOCKET_ENABLED | true | Enable WebSocket support |
| WEBSOCKET_PORT | 3027 | WebSocket server port |
| MESSAGE_RETENTION_DAYS | 365 | Days to retain message history |
| MAX_MESSAGE_LENGTH | 1000 | Maximum message length in characters |

## WebSocket

The messaging service supports real-time messaging via WebSocket on port 3027 (configurable via `WEBSOCKET_PORT`). Connect to `ws://localhost:3027` for real-time message delivery.

## Getting Started

```bash
# Install dependencies
ppnpm install

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Start development server
ppnpm start:dev
```

## API Routes

- `GET /v1/messaging/conversations` - Get all conversations for current user
- `POST /v1/messaging/conversations` - Create a new conversation
- `GET /v1/messaging/conversations/:conversationId/messages` - Get messages in a conversation
- `POST /v1/messaging/conversations/:conversationId/messages` - Send a message
- `POST /v1/messaging/conversations/:conversationId/read` - Mark messages as read
- `DELETE /v1/messaging/conversations/:conversationId` - Delete a conversation

## Ownership

- **Team**: Engagement Team
- **Maintainer**: messaging@azeeboplus.com
- **Last Updated**: 2026-06-17
