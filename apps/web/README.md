# Azeebo+ Web App

Next.js 15 web application for desktop and mobile browsers.

## Features

- Browse and stream content across all universes
- Creator dashboard and analytics
- Admin moderation tools
- Tipping and wallet management
- Real-time messaging
- SEO-optimized pages

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server (port 4000)
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_API_URL | Backend API URL |
| NEXT_PUBLIC_FIREBASE_CONFIG | Firebase config |
| NEXT_PUBLIC_SENTRY_DSN | Sentry DSN |

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TanStack Query 5
- Tailwind CSS 4
- Prisma (client-side)

## Project Structure

```
src/
├── app/              # Pages and layouts (App Router)
├── components/       # Reusable UI components
├── context/          # React context providers
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries
└── styles/           # Global styles
```
