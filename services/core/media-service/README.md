# Azeebo+ Media Service

> Port: 3019 | Database: `azeebo_media` | Analytics: Configured

## API Endpoints

### Upload (`/media`)

All upload endpoints require Bearer authentication.

| Method | Path | Rate Limit | Description |
|--------|------|------------|-------------|
| `POST` | `/media/upload/image` | 10/min | Upload an image file |
| `POST` | `/media/upload/video` | 5/min | Upload a video file |
| `POST` | `/media/upload/audio` | 10/min | Upload an audio file |
| `POST` | `/media/upload/document` | 10/min | Upload a document file |
| `POST` | `/media/upload/thumbnail` | 10/min | Upload a thumbnail image |
| `POST` | `/media/upload/avatar` | 5/min | Upload a user avatar |
| `POST` | `/media/upload/banner` | 5/min | Upload a user banner image |

**Presigned URLs:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/media/presigned/upload` | Get a presigned upload URL |
| `GET` | `/media/presigned/download` | Get a presigned download URL |

**File Management:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/media/metadata` | Get file metadata by key |
| `DELETE` | `/media/:key` | Delete a file by key (owner or admin) |

**Transcoding:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/media/transcoding/:jobId/status` | Bearer | Get transcoding job status |
| `GET` | `/media/transcoding/jobs` | Bearer | List transcoding jobs |
| `POST` | `/media/transcoding/retry-failed` | Admin | Retry failed transcoding jobs |

**Cleanup:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/media/cleanup/orphaned` | Admin | Cleanup orphaned files |

**Premium Content:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/media/premium/url` | Generate a premium content URL |
| `POST` | `/media/premium/url/cdn` | Generate a CDN premium content URL |
| `POST` | `/media/premium/url/validate` | Validate a premium content URL token |
| `DELETE` | `/media/premium/url/:token` | Invalidate a premium content URL |
| `DELETE` | `/media/premium/urls/user` | Invalidate all premium URLs for current user |
| `GET` | `/media/premium/url/:token/analytics` | Get analytics for a premium content URL |

### Admin (`/admin`)

All admin endpoints require `AdminGuard` authentication.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/stats` | Get media service statistics |
| `GET` | `/admin/uploads` | Get paginated uploads |
| `DELETE` | `/admin/uploads/:id` | Delete upload by id |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (storage + DB) |
| `GET` | `/health/live` | Liveness probe |
| `GET` | `/health/ready` | Readiness probe |

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `PORT` | 3019 | Service port |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `AWS_REGION` | us-east-1 | AWS region |
| `AWS_S3_BUCKET` | - | S3 bucket name |
| `AWS_ACCESS_KEY_ID` | - | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | - | AWS secret key |
| `REDIS_URL` | redis://localhost:6379 | Redis URL for transcoding job queue |

## Prisma Models

| Model | Table | Description |
|-------|-------|-------------|
| `MediaUpload` | `media_uploads` | Persistent metadata for uploaded media assets |
| `TranscodingJob` | `transcoding_jobs` | Video/audio transcoding job tracking |
