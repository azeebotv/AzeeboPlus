import React, { useMemo } from 'react';
import { View, Text, Linking, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { VideoView } from 'expo-video';
import type { VideoPlayer } from 'expo-video';

type MediaType = 's3' | 'youtube' | 'iframe' | 'ftp' | 'external' | 'unknown';

interface MediaUrlInfo {
  type: MediaType;
  url: string;
  embedUrl?: string;
  videoId?: string;
}

function detectMediaType(url: string): MediaUrlInfo {
  if (!url) return { type: 'unknown', url: '' };

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

  // iframe URLs
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

  // External URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return { type: 'external', url };
  }

  return { type: 'unknown', url };
}

interface MediaPlayerProps {
  url: string;
  thumbnail?: string;
  title?: string;
  player?: VideoPlayer;
  style?: object;
}

export function MediaPlayer({ url, thumbnail, title, player, style }: MediaPlayerProps) {
  const mediaInfo = useMemo(() => detectMediaType(url), [url]);

  if (mediaInfo.type === 'youtube' && mediaInfo.videoId) {
    return (
      <WebView
        source={{ uri: `https://www.youtube.com/embed/${mediaInfo.videoId}?autoplay=0&rel=0&modestbranding=1&controls=1&iv_load_policy=3` }}
        style={[{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }, style]}
        allowsFullscreenVideo
        javaScriptEnabled
      />
    );
  }

  if (mediaInfo.type === 'iframe') {
    return (
      <WebView
        source={{ uri: mediaInfo.url }}
        style={[{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }, style]}
        allowsFullscreenVideo
        javaScriptEnabled
      />
    );
  }

  if (mediaInfo.type === 'ftp') {
    return (
      <View style={[styles.ftpContainer, style]}>
        <Text style={styles.ftpTitle}>This content is available via FTP</Text>
        <TouchableOpacity onPress={() => Linking.openURL(mediaInfo.url)}>
          <Text style={styles.ftpLink}>Download via FTP</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (player) {
    return <VideoView player={player} style={[{ width: '100%', aspectRatio: 16 / 9 }, style]} />;
  }

  return null;
}

const styles = StyleSheet.create({
  ftpContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  ftpTitle: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 12,
  },
  ftpLink: {
    color: '#E8420A',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
