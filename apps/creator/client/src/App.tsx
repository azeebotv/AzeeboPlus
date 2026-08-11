import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import CreatorLayout from './components/CreatorLayout';
import DashboardPage from './routes/dashboard';
import OverviewPage from './routes/overview';
import AnalyticsPage from './routes/analytics';
import EarningsPage from './routes/earnings';
import ContentPage from './routes/content';
import SettingsPage from './routes/settings';
import PayoutsPage from './routes/payouts';
import SubscribersPage from './routes/subscribers';
import UploadPage from './routes/upload';
import MonetizationPage from './routes/monetization';
import ChallengesPage from './routes/challenges';
import LoginPage from './routes/login';
import { FlagGate } from './components/FlagGate';
import { CREATOR_FLAG_KEYS } from './hooks/useCreatorFlags';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

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
          <Routes>
            <Route path="/login" element={<LoginPage />} />
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
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
