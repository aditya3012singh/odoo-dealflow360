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
          <Route
            path="quotations"
            element={
              <PlaceholderPage
                title="Quotation Builder"
                description="Build quotations, apply discounts, view live margin, and submit for approval."
              />
            }
          />
          <Route
            path="approvals"
            element={
              <PlaceholderPage
                title="Approval Queue"
                description="Review pending approvals, see blended risk scores, and approve or reject quotations."
              />
            }
          />
          <Route
            path="fulfillment"
            element={
              <PlaceholderPage
                title="Fulfillment & Warehouse Split"
                description="View multi-warehouse allocation, apply manual overrides, and manage shipments."
              />
            }
          />
          <Route
            path="billing"
            element={
              <PlaceholderPage
                title="Billing & Invoices"
                description="Manage invoices, subscription schedules, proration, and record payments."
              />
            }
          />
          <Route
            path="orders"
            element={
              <PlaceholderPage
                title="Orders"
                description="View confirmed orders, track fulfillment status, and manage order lifecycle."
              />
            }
          />
          <Route
            path="deal-health"
            element={
              <PlaceholderPage
                title="Deal Health Dashboard"
                description="Monitor stalled deals, discount anomalies, margin erosion, and revenue slippage."
              />
            }
          />
          <Route
            path="reports"
            element={
              <PlaceholderPage
                title="Reports & Analytics"
                description="Filter by period, rep, product, and approval status. Export to PDF or XLS."
              />
            }
          />
          <Route
            path="customers"
            element={
              <PlaceholderPage
                title="Customer Management"
                description="View customers, manage tiers, issue portal tokens, and track portal activity."
              />
            }
          />
          <Route
            path="admin"
            element={
              <PlaceholderPage
                title="Admin Configuration"
                description="Configure products, price lists, discount tiers, warehouses, and subscription plans."
              />
            }
          />
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
