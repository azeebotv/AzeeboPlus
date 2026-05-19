# Media Service

Azeebo+ Media Service - Handles media file uploads, transcoding, and delivery.

## Features

- **File Upload**: Secure file upload to S3
- **Transcoding**: Video/audio transcoding with job queue
- **Signed URLs**: Time-limited secure URLs for media access
- **File Validation**: MIME type and size validation
- **Rate Limiting**: Protection against abuse

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3019 | Service port |
| AWS_REGION | us-east-1 | AWS region |
| AWS_S3_BUCKET | - | S3 bucket name |
| AWS_ACCESS_KEY_ID | - | AWS access key |
| AWS_SECRET_ACCESS_KEY | - | AWS secret key |
| REDIS_URL | redis://localhost:6379 | Redis URL for job queue |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start:dev
```

## API Routes

- `POST /v1/media/upload` - Upload media file
- `GET /v1/media/:id/status` - Get transcoding status
- `GET /v1/media/:id/url` - Get signed media URL

## File Limits

| Type | Extensions | Max Size |
|------|-----------|----------|
| Image | jpg, png, webp | 50MB |
| Video | mp4, webm | 500MB |
| Audio | mp3, aac | 100MB |
| Document | pdf | 50MB |

## Ownership

- **Team**: Platform Engineering
- **Maintainer**: platform@azeebo.com
- **Last Updated**: 2026-05-14
