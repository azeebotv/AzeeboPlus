'use client';

import { useMemo } from 'react';
import { detectMediaType, type MediaType } from '../lib/media-url';

interface MediaPlayerProps {
  url: string;
  thumbnail?: string;
  title?: string;
  width?: number;
  height?: number;
  className?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

function YouTubeEmbed({ videoId, width, height, className }: {
  videoId: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <iframe
      width={width || '100%'}
      height={height || '400'}
      src={`https://www.youtube.com/embed/${videoId}`}
      title="YouTube video player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className={className}
      style={{ borderRadius: '12px' }}
    />
  );
}

function IframeEmbed({ url, width, height, className }: {
  url: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <iframe
      width={width || '100%'}
      height={height || '400'}
      src={url}
      title="Embedded content"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className={className}
      style={{ borderRadius: '12px' }}
    />
  );
}

function VideoPlayer({ url, thumbnail, title, autoPlay, onEnded, onError, className }: {
  url: string;
  thumbnail?: string;
  title?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onError?: (error: string) => void;
  className?: string;
}) {
  return (
    <video
      src={url}
      poster={thumbnail}
      title={title}
      controls
      autoPlay={autoPlay}
      onEnded={onEnded}
      onError={() => onError?.('Failed to load video')}
      className={className}
      style={{ width: '100%', borderRadius: '12px', backgroundColor: '#000' }}
    >
      Your browser does not support the video tag.
    </video>
  );
}

function FtpLink({ url, title }: { url: string; title?: string }) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg text-center">
      <p className="text-white mb-2">This content is available via FTP</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline"
      >
        {title || 'Download via FTP'}
      </a>
    </div>
  );
}

export default function MediaPlayer({
  url,
  thumbnail,
  title,
  width,
  height,
  className = '',
  autoPlay = false,
  onEnded,
  onError,
}: MediaPlayerProps) {
  const mediaInfo = useMemo(() => detectMediaType(url), [url]);

  switch (mediaInfo.type) {
    case 'youtube':
      return (
        <YouTubeEmbed
          videoId={mediaInfo.videoId!}
          width={width}
          height={height}
          className={className}
        />
      );

    case 'iframe':
      return (
        <IframeEmbed
          url={mediaInfo.url}
          width={width}
          height={height}
          className={className}
        />
      );

    case 'ftp':
      return <FtpLink url={mediaInfo.url} title={title} />;

    case 's3':
    case 'external':
    default:
      return (
        <VideoPlayer
          url={mediaInfo.url}
          thumbnail={thumbnail}
          title={title}
          autoPlay={autoPlay}
          onEnded={onEnded}
          onError={onError}
          className={className}
        />
      );
  }
}
