# Asset Optimization Pipeline

## Overview

This document describes the asset optimization pipeline for Azeebo+ media service, covering image optimization, video transcoding, CDN integration, and lazy loading support.

## Image Optimization

### Supported Formats

| Format | Input | Output | Quality |
|--------|-------|--------|---------|
| JPEG | jpg, jpeg | webp, avif | 80% |
| PNG | png | webp | lossless |
| WebP | webp | avif | 80% |
| GIF | gif | webp | 80% |

### Image Sizes

| Name | Width | Height | Use Case |
|------|-------|--------|----------|
| thumbnail | 150px | 150px | Lists, cards |
| small | 480px | - | Mobile feeds |
| medium | 768px | - | Tablet, desktop |
| large | 1280px | - | Desktop HD |
| original | - | - | Download, print |

### Image Processing Pipeline

```typescript
interface ImageProcessingOptions {
  format: 'webp' | 'avif' | 'jpeg' | 'png';
  width?: number;
  height?: number;
  quality?: number; // 0-100
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

class ImageOptimizer {
  async process(inputBuffer: Buffer, options: ImageProcessingOptions): Promise<Buffer> {
    // 1. Validate input
    // 2. Resize if needed
    // 3. Convert format
    // 4. Optimize quality
    // 5. Return processed buffer
  }

  async generateVariants(inputBuffer: Buffer): Promise<Map<string, Buffer>> {
    const variants = new Map<string, Buffer>();

    for (const size of ['thumbnail', 'small', 'medium', 'large']) {
      variants.set(size, await this.process(inputBuffer, { width: SIZES[size] }));
    }

    // Generate WebP versions
    for (const size of ['small', 'medium', 'large']) {
      const webpBuffer = await this.process(inputBuffer, {
        width: SIZES[size],
        format: 'webp',
      });
      variants.set(`${size}_webp`, webpBuffer);
    }

    return variants;
  }
}
```

## Video Transcoding

### Video Presets

| Preset | Resolution | Bitrate | Use Case |
|--------|-----------|---------|----------|
| 144p | 256x144 | 400kbps | Mobile data saver |
| 360p | 640x360 | 800kbps | Mobile standard |
| 480p | 854x480 | 1.5Mbps | Tablet |
| 720p | 1280x720 | 3Mbps | Desktop HD |
| 1080p | 1920x1080 | 5Mbps | Full HD |
| 4k | 3840x2160 | 15Mbps | Premium |

### Video Processing Pipeline

```typescript
interface VideoProcessingOptions {
  inputPath: string;
  outputPath: string;
  preset: VideoPreset;
  codec: 'h264' | 'h265' | 'vp9';
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  fps: number;
}

class VideoTranscoder {
  async transcode(input: string, options: VideoProcessingOptions): Promise<string> {
    // 1. Extract metadata
    const metadata = await this.getMetadata(input);

    // 2. Generate thumbnail
    await this.generateThumbnail(input, `${options.outputPath}.thumb.jpg`);

    // 3. Transcode to target resolution
    await this.runFFmpeg(input, options);

    // 4. Generate HLS playlist
    await this.generateHLS(options.outputPath);

    return options.outputPath;
  }

  async generateHLS(inputPath: string): Promise<void> {
    // Generate multiple quality streams
    // Create master playlist
  }
}
```

## CDN Integration

### CDN Configuration

```typescript
interface CDNConfig {
  provider: 'cloudfront' | 'cloudflare' | 'fastly';
  bucket: string;
  distributionDomain: string;
  signedUrlExpiry: number; // seconds
}

class CDNService {
  private config: CDNConfig;

  async uploadAsset(key: string, buffer: Buffer, contentType: string): Promise<string> {
    // Upload to S3
    await this.s3.putObject({
      Bucket: this.config.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    // Invalidate CDN cache
    await this.invalidateCache(key);

    return this.getSignedUrl(key);
  }

  getSignedUrl(key: string, expirySeconds?: number): string {
    // Generate signed URL with expiration
    const expiry = expirySeconds || this.config.signedUrlExpiry;
    return `https://${this.config.distributionDomain}/${key}?expires=${Date.now() + expiry * 1000}&signature=...`;
  }

  async invalidateCache(key: string): Promise<void> {
    // Create CloudFront invalidation
  }
}
```

## Lazy Loading

### Client-Side Lazy Loading

```typescript
interface LazyLoadOptions {
  threshold?: number; // 0-1, default 0.1
  rootMargin?: string; // default '50px'
  placeholder?: string;
}

class LazyImageLoader {
  constructor(private observer: IntersectionObserver) {}

  observe(element: HTMLImageElement, src: string, options?: LazyLoadOptions): void {
    // Set placeholder
    if (options?.placeholder) {
      element.src = options.placeholder;
    }

    // Add data-src for actual image
    element.dataset.src = src;
    element.dataset.lazy = 'true';

    // Start observing
    this.observer.observe(element);
  }
}

// Usage in React
const LazyImage = ({ src, alt, ...props }) => {
  const imgRef = useRef<HTMLImageElement>();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src;
          observer.unobserve(img);
        }
      });
    }, { threshold: 0.1, rootMargin: '50px' });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return <img ref={imgRef} data-src={src} alt={alt} {...props} />;
};
```

### Server-Side Lazy Loading

```typescript
interface PaginatedAssets {
  items: Asset[];
  nextCursor?: string;
  hasMore: boolean;
}

async getAssetsByCursor(cursor?: string, limit = 20): Promise<PaginatedAssets> {
  const items = await this.prisma.mediaAsset.findMany({
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = items.length > limit;
  const result = hasMore ? items.slice(0, -1) : items;

  return {
    items: result,
    nextCursor: hasMore ? result[result.length - 1].id : undefined,
    hasMore,
  };
}
```

## Storage Tiers

| Tier | Type | Cost | Use Case |
|------|------|------|----------|
| Hot | SSD | High | Recently uploaded, frequently accessed |
| Cool | HDD | Medium | Older content, moderate access |
| Archive | Glacier | Low | Old content, rare access |

```typescript
interface StorageTierConfig {
  hot: { days: 0; storageClass: 'STANDARD' };
  cool: { days: 30; storageClass: 'STANDARD_IA' };
  archive: { days: 90; storageClass: 'GLACIER' };
}

async function transitionAsset(asset: Asset): Promise<void> {
  const daysSinceUpload = differenceInDays(new Date(), asset.createdAt);

  if (daysSinceUpload >= 90) {
    await this.s3.transitionToGlacier(asset.s3Key);
  } else if (daysSinceUpload >= 30) {
    await this.s3.transitionToStandardIA(asset.s3Key);
  }
}
```

## API Endpoints

### Image Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/media/images/upload` | Upload and process image |
| GET | `/media/images/:id/variants` | Get all variants |
| GET | `/media/images/:id/:size` | Get specific size |
| POST | `/media/images/:id/reprocess` | Regenerate variants |

### Video Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/media/videos/upload` | Upload video |
| GET | `/media/videos/:id/status` | Get processing status |
| GET | `/media/videos/:id/playlist` | Get HLS playlist |
| POST | `/media/videos/:id/transcode` | Trigger transcoding |

## Monitoring

### Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|------------------|
| upload_duration | Time to upload | > 30s |
| processing_duration | Time to process | > 60s |
| transcode_duration | Time to transcode | > 5min |
| storage_used | Total storage used | > 80% |
| cdn_cache_hit_rate | Cache efficiency | < 80% |

### Logs

```typescript
interface MediaProcessingLog {
  assetId: string;
  operation: 'upload' | 'resize' | 'transcode' | 'upload_to_cdn';
  duration: number;
  status: 'success' | 'failed';
  error?: string;
  metadata: Record<string, unknown>;
}
```

## Checklist

- [ ] Image optimization working (WebP, AVIF)
- [ ] All image sizes generated
- [ ] Video transcoding configured
- [ ] HLS playlist generation working
- [ ] CDN integration complete
- [ ] Signed URLs implemented
- [ ] Lazy loading implemented
- [ ] Storage tiering configured
- [ ] Monitoring dashboards set up