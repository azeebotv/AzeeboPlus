import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import AdminLayout from './components/AdminLayout';
import DashboardPage from './routes/dashboard';
import OverviewPage from './routes/overview';
import UsersPage from './routes/users';
import UserDetailPage from './routes/user-detail';
import ContentPage from './routes/content';
import ContentReviewPage from './routes/content-review';
import CreatorsPage from './routes/creators';
import RealityPage from './routes/reality';
import UniversesPage from './routes/universes';
import WalletsPage from './routes/wallets';
import FinancialPage from './routes/financial';
import PaymentGatewaysPage from './routes/payment-gateways';
import EngagementPage from './routes/engagement';
import NotificationsPage from './routes/notifications';
import AnnouncementsPage from './routes/announcements';
import AuditLogsPage from './routes/audit-logs';
import ReportsPage from './routes/reports';
import ReportBuilderPage from './routes/report-builder';
import SettingsPage from './routes/settings';
import LoginPage from './routes/login';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function AdminLayoutWrapper() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AdminLayoutWrapper />}>
              <Route index element={<DashboardPage />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="users/:id" element={<UserDetailPage />} />
              <Route path="content" element={<ContentPage />} />
              <Route path="content-review" element={<ContentReviewPage />} />
              <Route path="creators" element={<CreatorsPage />} />
              <Route path="reality" element={<RealityPage />} />
              <Route path="universes" element={<UniversesPage />} />
              <Route path="wallets" element={<WalletsPage />} />
              <Route path="financial" element={<FinancialPage />} />
              <Route path="payment-gateways" element={<PaymentGatewaysPage />} />
              <Route path="engagement" element={<EngagementPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="reports/builder" element={<ReportBuilderPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
