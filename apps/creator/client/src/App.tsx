import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import CreatorLayout from './components/CreatorLayout';
import { FlagGate } from './components/FlagGate';
import { CREATOR_FLAG_KEYS } from './hooks/useCreatorFlags';

const DashboardPage = lazy(() => import('./routes/dashboard'));
const OverviewPage = lazy(() => import('./routes/overview'));
const AnalyticsPage = lazy(() => import('./routes/analytics'));
const EarningsPage = lazy(() => import('./routes/earnings'));
const ContentPage = lazy(() => import('./routes/content'));
const SettingsPage = lazy(() => import('./routes/settings'));
const PayoutsPage = lazy(() => import('./routes/payouts'));
const SubscribersPage = lazy(() => import('./routes/subscribers'));
const UploadPage = lazy(() => import('./routes/upload'));
const MonetizationPage = lazy(() => import('./routes/monetization'));
const ChallengesPage = lazy(() => import('./routes/challenges'));
const ChallengeDetailPage = lazy(() => import('./routes/challenge-detail'));
const ProfilePage = lazy(() => import('./routes/profile'));
const LoginPage = lazy(() => import('./routes/login'));
const PublicBoardPage = lazy(() => import('./routes/public-board'));
const NotFoundPage = lazy(() => import('./routes/not-found'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function RouteFallback() {
  // Inline styles on purpose: this portal does not load Tailwind, so utility
  // classes here would render unstyled text pinned to the top-left corner.
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        color: 'var(--creator-text-muted)',
        backgroundColor: 'var(--creator-bg)',
      }}
    >
      Loading…
    </div>
  );
}

function CreatorLayoutWrapper() {
  return (
    <CreatorLayout>
      <Outlet />
    </CreatorLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              {/* Public shareable board — outside the authed layout on purpose. */}
              <Route path="/boards/:challengeId" element={<PublicBoardPage />} />
              <Route element={<CreatorLayoutWrapper />}>
                <Route index element={<DashboardPage />} />
                <Route path="overview" element={<OverviewPage />} />
                <Route
                  path="analytics"
                  element={
                    <FlagGate flag={CREATOR_FLAG_KEYS.newAnalytics}>
                      <AnalyticsPage />
                    </FlagGate>
                  }
                />
                <Route path="earnings" element={<EarningsPage />} />
                <Route path="content" element={<ContentPage />} />
                <Route path="upload" element={<UploadPage />} />
                <Route
                  path="payouts"
                  element={
                    <FlagGate flag={CREATOR_FLAG_KEYS.payoutsUi}>
                      <PayoutsPage />
                    </FlagGate>
                  }
                />
                <Route path="subscribers" element={<SubscribersPage />} />
                <Route path="monetization" element={<MonetizationPage />} />
                <Route path="challenges" element={<ChallengesPage />} />
                <Route path="challenges/:challengeId" element={<ChallengeDetailPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              {/* React Router renders nothing for unmatched paths; without this
                  a stale or prefixed URL is a blank page. */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
