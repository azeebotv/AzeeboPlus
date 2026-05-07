# Expo Build Environment Configuration

## Overview
This document describes how to configure the Expo build environment to work correctly without relying on the default `~/.expo` sandbox directory.

## Environment Variables

Set these environment variables to configure Expo cache and telemetry paths:

### Unix/macOS
```bash
export EXPO_TELEMETRY_DEBUG=0
export EXPO_NO_TELEMETRY=1
export EXPO_CACHE_DIR=/tmp/azeebo-expo-cache
export EXPO_BUILD_CACHE_DIR=/tmp/azeebo-build-cache
export EAS_LOCAL_BUILD_SKIP_CREDENTIAL_CHECK=1
```

### Windows (PowerShell)
```powershell
$env:EXPO_TELEMETRY_DEBUG="0"
$env:EXPO_NO_TELEMETRY="1"
$env:EXPO_CACHE_DIR="C:\tmp\azeebo-expo-cache"
$env:EXPO_BUILD_CACHE_DIR="C:\tmp\azeebo-build-cache"
$env:EAS_LOCAL_BUILD_SKIP_CREDENTIAL_CHECK="1"
```

## CI/CD Configuration

For CI environments, use these environment variables:

```bash
# Disable telemetry in CI
EXPO_NO_TELEMETRY=1

# Use ephemeral cache directories
EXPO_CACHE_DIR=$(mktemp -d)
EXPO_BUILD_CACHE_DIR=$(mktemp -d)

# Skip credential checks for local builds
EAS_LOCAL_BUILD_SKIP_CREDENTIAL_CHECK=1
```

## Local Development

For local development without Expo sandbox:

1. Create a `.env.local` file in `apps/mobile/`:
```bash
EXPO_NO_TELEMETRY=1
EXPO_CACHE_DIR=/tmp/azeebo-expo-cache
```

2. Or run with environment variables:
```bash
EXPO_NO_TELEMETRY=1 npx expo start
```

## EAS Build

For EAS Build cloud builds, the configuration is handled automatically by EAS.

For local builds with EAS:
```bash
eas build --local --platform ios
eas build --local --platform android
```

## Troubleshooting

### Issue: Build fails with "Cannot create ~/.expo"
**Solution**: Set `EXPO_CACHE_DIR` to a writable temporary directory as shown above.

### Issue: Telemetry upload fails
**Solution**: Set `EXPO_NO_TELEMETRY=1` to disable telemetry collection.

### Issue: Credential errors in CI
**Solution**: Set `EAS_LOCAL_BUILD_SKIP_CREDENTIAL_CHECK=1` for local builds in CI.

## Cache Directory Setup

To ensure builds are reproducible and faster, create a persistent cache directory:

```bash
mkdir -p ~/Library/Caches/AzeeboBuild
export EXPO_CACHE_DIR=~/Library/Caches/AzeeboBuild
export EXPO_BUILD_CACHE_DIR=~/Library/Caches/AzeeboBuild
```
