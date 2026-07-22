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
import LoginPage from './routes/login';

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
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="earnings" element={<EarningsPage />} />
              <Route path="content" element={<ContentPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
