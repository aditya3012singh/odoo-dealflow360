import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store/store';
import { useAppDispatch } from './store/hooks';
import { loadUser } from './store/slices/authSlice';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PortalProtectedRoute } from './components/auth/PortalProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PortalLayout } from './components/layout/PortalLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { PortalLoginPage } from './pages/portal/PortalLoginPage';
import { PortalDashboard } from './pages/portal/PortalDashboard';
import { PortalQuotationDetail } from './pages/portal/PortalQuotationDetail';
import { PortalProfilePage } from './pages/portal/PortalProfilePage';
import { QuotationListPage } from './pages/quotations/QuotationListPage';
import { QuotationBuilderPage } from './pages/quotations/QuotationBuilderPage';
import { ApprovalQueuePage } from './pages/approvals/ApprovalQueuePage';
import { FulfillmentPage } from './pages/fulfillment/FulfillmentPage';
import { BillingPage } from './pages/billing/BillingPage';
import { DealHealthPage } from './pages/intelligence/DealHealthPage';
import { CustomerListPage } from './pages/customers/CustomerListPage';
import { ReportsAnalyticsPage } from './pages/reports/ReportsAnalyticsPage';
import { AdminConfigPage } from './pages/admin/AdminConfigPage';

import { ThemeProvider } from './context/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

// Inner component that can use Redux hooks
function AppRoutes() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ── CUSTOMER PORTAL ── */}
        <Route path="/login" element={<PortalLoginPage />} />
        <Route
          path="/portal"
          element={
            <PortalProtectedRoute>
              <PortalLayout />
            </PortalProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/portal/dashboard" replace />} />
          <Route path="dashboard" element={<PortalDashboard />} />
          <Route path="quotations/:id" element={<PortalQuotationDetail />} />
          <Route path="profile" element={<PortalProfilePage />} />
        </Route>

        {/* ── EMPLOYEE WORKSPACE ── */}
        <Route path="/workspace" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="quotations" element={<QuotationListPage />} />
          <Route path="quotations/new" element={<QuotationBuilderPage />} />
          <Route path="quotations/:id" element={<QuotationBuilderPage />} />
          <Route path="approvals" element={<ApprovalQueuePage />} />
          <Route path="fulfillment" element={<FulfillmentPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="orders" element={<FulfillmentPage />} />
          <Route path="deal-health" element={<DealHealthPage />} />
          <Route path="reports" element={<ReportsAnalyticsPage />} />
          <Route path="customers" element={<CustomerListPage />} />
          <Route path="admin" element={<AdminConfigPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Root redirect → portal login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
