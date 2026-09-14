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
import SearchAnalyticsPage from './routes/search';
import NotificationsPage from './routes/notifications';
import AnnouncementsPage from './routes/announcements';
import AuditLogsPage from './routes/audit-logs';
import OpsPage from './routes/ops';
import ReportsPage from './routes/reports';
import ReportBuilderPage from './routes/report-builder';
import SettingsPage from './routes/settings';
import SubscriptionsPage from './routes/subscriptions';
import FeatureFlagsPage from './routes/feature-flags';
import GlobalFeatureFlagsPage from './routes/global-feature-flags';
import AgbalaPage from './routes/agbala';
import LiveEventsPage from './routes/live-events';
import BundlePassesPage from './routes/bundle-passes';
import TippingPage from './routes/tipping';
import AgentsPage from './routes/agents';
import CostDashboardPage from './routes/cost-dashboard';
import TaskRouterPage from './routes/task-router';
import RiskEnginePage from './routes/risk-engine';
import CapacityLedgerPage from './routes/capacity-ledger';
import SystemHealthPage from './routes/system-health';
import ServiceHealthPage from './routes/service-health';
import PerformanceMonitorPage from './routes/performance-monitor';
import RateLimitsPage from './routes/rate-limits';
import AutomationsPage from './routes/automations';
import LoginPage from './routes/login';
import { FlagGate } from './components/FlagGate';
import { useAdminFlags, ADMIN_FLAG_KEYS } from './hooks/useAdminFlags';

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

/** Picks the old vs new dashboard layout based on admin_new_dashboard. */
function DashboardGate() {
  const { isEnabled, isLoading } = useAdminFlags();
  if (isLoading) return null;
  return isEnabled(ADMIN_FLAG_KEYS.newDashboard) ? <OverviewPage /> : <DashboardPage />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AdminLayoutWrapper />}>
              <Route index element={<DashboardGate />} />
              <Route
                path="overview"
                element={
                  <FlagGate flag={ADMIN_FLAG_KEYS.newDashboard}>
                    <OverviewPage />
                  </FlagGate>
                }
              />
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
              <Route path="search" element={<SearchAnalyticsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="ops" element={<OpsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route
                path="reports/builder"
                element={
                  <FlagGate flag={ADMIN_FLAG_KEYS.reportBuilder}>
                    <ReportBuilderPage />
                  </FlagGate>
                }
              />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="feature-flags" element={<FeatureFlagsPage />} />
              <Route path="feature-flags/global" element={<GlobalFeatureFlagsPage />} />
              <Route path="agbala" element={<AgbalaPage />} />
              <Route path="live-events" element={<LiveEventsPage />} />
              <Route path="bundle-passes" element={<BundlePassesPage />} />
              <Route path="tipping" element={<TippingPage />} />
              <Route path="agents" element={<AgentsPage />} />
              <Route path="cost-dashboard" element={<CostDashboardPage />} />
              <Route path="task-router" element={<TaskRouterPage />} />
              <Route path="risk-engine" element={<RiskEnginePage />} />
              <Route path="capacity-ledger" element={<CapacityLedgerPage />} />
              <Route path="system-health" element={<SystemHealthPage />} />
              <Route path="service-health" element={<ServiceHealthPage />} />
              <Route path="performance" element={<PerformanceMonitorPage />} />
              <Route path="rate-limits" element={<RateLimitsPage />} />
              <Route path="automations" element={<AutomationsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
