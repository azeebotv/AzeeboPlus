import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function GET(request: NextRequest) {
  const manifest = {
    name: 'Azeebo+ - Premium Content Streaming',
    short_name: 'Azeebo+',
    description: 'Discover and stream premium content from top creators',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#7c3aed',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    categories: ['entertainment', 'video', 'streaming'],
    shortcuts: [
      {
        name: 'Browse Content',
        short_name: 'Browse',
        description: 'Browse premium content',
        url: '/browse',
        icons: [{ src: '/icon-browse.png', sizes: '192x192' }],
      },
      {
        name: 'My Library',
        short_name: 'Library',
        description: 'Access your saved content',
        url: '/library',
        icons: [{ src: '/icon-library.png', sizes: '192x192' }],
      },
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
