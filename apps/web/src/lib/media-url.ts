/**
 * Detect the type of media URL and return the appropriate handler
 */

export type MediaType = 's3' | 'youtube' | 'iframe' | 'ftp' | 'external' | 'unknown';

export interface MediaUrlInfo {
  type: MediaType;
  url: string;
  embedUrl?: string;
  videoId?: string;
}

/**
 * Detect media URL type
 */
export function detectMediaType(url: string): MediaUrlInfo {
  if (!url) {
    return { type: 'unknown', url: '' };
  }

  // YouTube URLs
  const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return {
      type: 'youtube',
      url,
      videoId: youtubeMatch[1],
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
    };
  }

  // iframe URLs (already embedded)
  if (url.includes('<iframe') || url.includes('iframe')) {
    return { type: 'iframe', url };
  }

  // FTP URLs
  if (url.startsWith('ftp://') || url.startsWith('ftps://')) {
    return { type: 'ftp', url };
  }

  // S3 URLs
  if (url.includes('.s3.') || url.includes('amazonaws.com')) {
    return { type: 's3', url };
  }

  // External URLs (http/https)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return { type: 'external', url };
  }

  return { type: 'unknown', url };
}

/**
 * Check if URL is a video
 */
export function isVideoUrl(url: string): boolean {
  const videoExtensions = /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)(\?|$)/i;
  const videoHosts = /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com/i;

  return videoExtensions.test(url) || videoHosts.test(url);
}

/**
 * Check if URL is an image
 */
export function isImageUrl(url: string): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i;
  return imageExtensions.test(url);
}
