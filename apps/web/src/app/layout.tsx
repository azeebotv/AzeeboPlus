import type { Metadata } from 'next';
import React from 'react';
import { Inter } from '@next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { WalletProvider } from '../context/WalletContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://azeebo.com'),
  title: {
    default: 'Azeebo+ - Premium Content Streaming',
    template: '%s | Azeebo+',
  },
  description:
    'Discover and stream premium content from top creators. Movies, shows, and exclusive content from your favorite universes.',
  keywords: ['streaming', 'premium content', 'movies', 'shows', 'creators', 'entertainment'],
  authors: [{ name: 'Azeebo+ Team' }],
  creator: 'Azeebo+',
  publisher: 'Azeebo+',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Azeebo+',
    title: 'Azeebo+ - Premium Content Streaming',
    description: 'Discover and stream premium content from top creators',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Azeebo+',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Azeebo+ - Premium Content Streaming',
    description: 'Discover and stream premium content from top creators',
    images: ['/og-image.png'],
    creator: '@azeeboplus',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <WalletProvider>{children}</WalletProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
