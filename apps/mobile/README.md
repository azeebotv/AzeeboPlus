# Azeebo+ Mobile App

React Native mobile application for iOS and Android.

## Features

- Browse and stream content across all universes
- Tipping and wallet management
- Live chat and messaging
- Push notifications
- Biometric authentication
- Offline content caching

## Getting Started

```bash
# Install dependencies
pnpm install

# Start iOS
pnpm ios

# Start Android
pnpm android

# Run tests
pnpm test
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| API_BASE_URL | Backend API base URL |
| FIREBASE_CONFIG | Firebase configuration JSON |
| SENTRY_DSN | Sentry error tracking DSN |

## Tech Stack

- React Native 0.76+
- Expo SDK 52
- React Navigation 7
- TanStack Query 5
- React Native Reanimated 3
- i18next (internationalization)

## Project Structure

```
src/
├── app/              # Screen files (file-based routing)
├── components/       # Reusable UI components
├── api/              # API client modules
├── hooks/            # Custom React hooks
├── i18n/             # Translation files
├── theme/            # Theme tokens and styles
└── utils/            # Utility functions
```
