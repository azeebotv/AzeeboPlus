import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { WalletProvider } from '../context/WalletContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { QueryProvider } from '../providers/QueryProvider';
import { ToastProvider } from '@/components/ToastProvider';
import { KeyboardNavigationProvider } from '../components/KeyboardNavigationProvider';

import { Inter, Montserrat } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-display-base',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://azeeboplus.com'),
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

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${montserrat.variable}`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ErrorBoundary>
          <QueryProvider>
            <ThemeProvider>
              <AuthProvider>
                <WalletProvider>
                  <ToastProvider>
                    <KeyboardNavigationProvider>
                      <main id="main-content" role="main">
                        {children}
                      </main>
                    </KeyboardNavigationProvider>
                  </ToastProvider>
                </WalletProvider>
              </AuthProvider>
            </ThemeProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
