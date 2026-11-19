import { getPublicBaseUrl } from '@azeebo/shared-types';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { FlagsProvider } from '../context/FlagsContext';
import { WalletProvider } from '../context/WalletContext';
import { MaintenanceGate } from '../components/layout/MaintenanceGate';
import { UniverseGate } from '../components/layout/UniverseGate';
import AnnouncementBanner from '../components/layout/AnnouncementBanner';
import { ThemeProvider } from '../context/ThemeContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { QueryProvider } from '../providers/QueryProvider';
import { ToastProvider } from '@/components/ToastProvider';
import I18nProvider from '@/components/I18nProvider';
import { KeyboardNavigationProvider } from '../components/KeyboardNavigationProvider';
import { CookieConsent } from '../components/privacy/CookieConsent';
import { OfflineBanner, NetworkProvider } from '../components/ui/OfflineIndicator';
import { OfflineProvider } from '../context/OfflineContext';
import { ServiceWorkerRegistration } from '../components/ServiceWorkerRegistration';
import { WebVitalsInit } from '../components/WebVitalsInit';
import { PageViewTracker } from '../components/PageViewTracker';
import { Suspense } from 'react';

import { Inter, Montserrat } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-display-base',
});

// AUD-06: the middleware CSP is nonce-based, and nonces only work when HTML
// is rendered per request — prerendered (SSG/ISR) HTML is baked at build time
// without nonce attributes, so `script-src` would block every script on it.
// Cascades to all routes under this root layout (override per segment only if
// a route is later proven to need no scripts).
export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: 'var(--color-az-surface-root)',
};

export const metadata: Metadata = {
  metadataBase: new URL(getPublicBaseUrl()),
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
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${montserrat.variable} min-h-screen`}
        style={{ backgroundColor: 'var(--color-az-surface-root)', color: 'var(--text-primary)' }}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <FlagsProvider>
                <ThemeProvider>
                  <WalletProvider>
                    <I18nProvider>
                      <NetworkProvider>
                        <OfflineProvider>
                          <ToastProvider>
                            <KeyboardNavigationProvider>
                              <ServiceWorkerRegistration />
                              <WebVitalsInit />
                              <Suspense fallback={null}>
                                <PageViewTracker />
                              </Suspense>
                              <OfflineBanner />
                              <AnnouncementBanner />
                              <CookieConsent />
                              <MaintenanceGate>
                                <UniverseGate>
                                  <main id="main-content" role="main">
                                    {children}
                                  </main>
                                </UniverseGate>
                              </MaintenanceGate>
                            </KeyboardNavigationProvider>
                          </ToastProvider>
                        </OfflineProvider>
                      </NetworkProvider>
                    </I18nProvider>
                  </WalletProvider>
                </ThemeProvider>
              </FlagsProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
