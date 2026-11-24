import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ConfirmProvider } from './components/ui/ConfirmContext';
import AdminLayout from './components/AdminLayout';
import { FlagGate } from './components/FlagGate';
import { useAdminFlags, ADMIN_FLAG_KEYS } from './hooks/useAdminFlags';

// Route-level code splitting — each route is its own chunk so the initial
// bundle stays small.
const DashboardPage = lazy(() => import('./routes/dashboard'));
const OverviewPage = lazy(() => import('./routes/overview'));
const UsersPage = lazy(() => import('./routes/users'));
const UserDetailPage = lazy(() => import('./routes/user-detail'));
const ContentPage = lazy(() => import('./routes/content'));
const MoviesPage = lazy(() => import('./routes/movies'));
const ContentDetailPage = lazy(() => import('./routes/content-detail'));
const ContentReviewPage = lazy(() => import('./routes/content-review'));
const AcdpValidationPage = lazy(() => import('./routes/acdp-validation'));
const ChallengeEntriesPage = lazy(() => import('./routes/challenge-entries'));
const ModerationPage = lazy(() => import('./routes/moderation'));
const CreatorsPage = lazy(() => import('./routes/creators'));
const RealityPage = lazy(() => import('./routes/reality'));
const VerticalSeriesPage = lazy(() => import('./routes/vertical-series'));
const SportsPage = lazy(() => import('./routes/sports'));
const ComedyPage = lazy(() => import('./routes/comedy'));
const GamesPage = lazy(() => import('./routes/games'));
const MusicPage = lazy(() => import('./routes/music'));
const RewardsPage = lazy(() => import('./routes/rewards'));
const ReferralsPage = lazy(() => import('./routes/referrals'));
const MerchandisePage = lazy(() => import('./routes/merchandise'));
const UniversesPage = lazy(() => import('./routes/universes'));
const WalletsPage = lazy(() => import('./routes/wallets'));
const FinancialPage = lazy(() => import('./routes/financial'));
const PaymentGatewaysPage = lazy(() => import('./routes/payment-gateways'));
const EngagementPage = lazy(() => import('./routes/engagement'));
const SearchAnalyticsPage = lazy(() => import('./routes/search'));
const NotificationsPage = lazy(() => import('./routes/notifications'));
const AnnouncementsPage = lazy(() => import('./routes/announcements'));
const AuditLogsPage = lazy(() => import('./routes/audit-logs'));
const OpsPage = lazy(() => import('./routes/ops'));
const ReportsPage = lazy(() => import('./routes/reports'));
const ReportBuilderPage = lazy(() => import('./routes/report-builder'));
const SettingsPage = lazy(() => import('./routes/settings'));
const SubscriptionsPage = lazy(() => import('./routes/subscriptions'));
const PlanDetailPage = lazy(() => import('./routes/plan-detail'));
const FeatureFlagsPage = lazy(() => import('./routes/feature-flags'));
const GlobalFeatureFlagsPage = lazy(() => import('./routes/global-feature-flags'));
const AgbalaPage = lazy(() => import('./routes/agbala'));
const StoryworldDetailPage = lazy(() => import('./routes/storyworld-detail'));
const LiveEventsPage = lazy(() => import('./routes/live-events'));
const BundlePassesPage = lazy(() => import('./routes/bundle-passes'));
const PartnerBanksPage = lazy(() => import('./routes/partner-banks'));
const TippingPage = lazy(() => import('./routes/tipping'));
const AgentsPage = lazy(() => import('./routes/agents'));
const CostDashboardPage = lazy(() => import('./routes/cost-dashboard'));
const TaskRouterPage = lazy(() => import('./routes/task-router'));
const RiskEnginePage = lazy(() => import('./routes/risk-engine'));
const CapacityLedgerPage = lazy(() => import('./routes/capacity-ledger'));
const SystemHealthPage = lazy(() => import('./routes/system-health'));
const ServiceHealthPage = lazy(() => import('./routes/service-health'));
const PerformanceMonitorPage = lazy(() => import('./routes/performance-monitor'));
const RateLimitsPage = lazy(() => import('./routes/rate-limits'));
const AutomationsPage = lazy(() => import('./routes/automations'));
const SupportPage = lazy(() => import('./routes/support'));
const DualControlPage = lazy(() => import('./routes/dual-control'));
const TalentClearancePage = lazy(() => import('./routes/talent-clearance'));
const LifestyleGuidesPage = lazy(() => import('./routes/lifestyle-guides'));
const MenusPage = lazy(() => import('./routes/menus'));
const LoginPage = lazy(() => import('./routes/login'));
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
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        color: 'var(--admin-text-muted)',
        backgroundColor: 'var(--admin-bg)',
      }}
    >
      Loading…
    </div>
  );
}

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
        <ConfirmProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
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
                <Route path="movies" element={<MoviesPage />} />
                <Route path="content/:id" element={<ContentDetailPage />} />
                <Route path="content-review" element={<ContentReviewPage />} />
                <Route path="acdp-validation" element={<AcdpValidationPage />} />
                <Route path="challenge-entries" element={<ChallengeEntriesPage />} />
                <Route path="moderation" element={<ModerationPage />} />
                <Route path="creators" element={<CreatorsPage />} />
                <Route path="reality" element={<RealityPage />} />
                <Route path="vertical-series" element={<VerticalSeriesPage />} />
                <Route path="sports" element={<SportsPage />} />
                <Route path="comedy" element={<ComedyPage />} />
                <Route path="games" element={<GamesPage />} />
                <Route path="music" element={<MusicPage />} />
                <Route path="rewards" element={<RewardsPage />} />
                <Route path="referrals" element={<ReferralsPage />} />
                <Route path="merchandise" element={<MerchandisePage />} />
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
                <Route path="subscriptions/plans/:id" element={<PlanDetailPage />} />
                <Route path="feature-flags" element={<FeatureFlagsPage />} />
                <Route path="feature-flags/global" element={<GlobalFeatureFlagsPage />} />
                <Route path="agbala" element={<AgbalaPage />} />
                <Route path="agbala/storyworlds/:id" element={<StoryworldDetailPage />} />
                <Route path="live-events" element={<LiveEventsPage />} />
                <Route path="bundle-passes" element={<BundlePassesPage />} />
                <Route path="partner-banks" element={<PartnerBanksPage />} />
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
                <Route path="support" element={<SupportPage />} />
                <Route path="dual-control" element={<DualControlPage />} />
                <Route path="talent-clearance" element={<TalentClearancePage />} />
                <Route path="lifestyle-guides" element={<LifestyleGuidesPage />} />
                <Route path="menus" element={<MenusPage />} />
              </Route>
              {/* React Router renders nothing for unmatched paths; without this
                  a stale or prefixed URL is a blank page. */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </ConfirmProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
