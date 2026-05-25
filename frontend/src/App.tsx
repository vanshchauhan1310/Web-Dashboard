import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AgGridProvider } from 'ag-grid-react';
import { AllCommunityModule } from 'ag-grid-community';
import { ThemeProvider } from './context/ThemeContext';

import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardSelector from './pages/DashboardSelector';
import AppLayout from './layouts/AppLayout';
import ProcurementLayout from './layouts/ProcurementLayout';
import Dashboard from './pages/Dashboard';
import GeographyDashboard from './pages/GeographyDashboard';
import ProductPerformanceDashboard from './pages/ProductPerformanceDashboard';
import ShippingOperationsDashboard from './pages/ShippingOperationsDashboard';
import SpendOverviewDashboard from './pages/procurement/SpendOverviewDashboard';
import SupplierPerformanceDashboard from './pages/procurement/SupplierPerformanceDashboard';
import PurchaseOrdersDashboard from './pages/procurement/PurchaseOrdersDashboard';
import InventoryAnalysisDashboard from './pages/procurement/InventoryAnalysisDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AgGridProvider modules={[AllCommunityModule]}>
          <Router>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Dashboard selector — landing page after login */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardSelector />
                  </ProtectedRoute>
                }
              />

              {/* Sales master dashboard */}
              <Route
                path="/sales"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="executive" replace />} />
                <Route path="executive" element={<Dashboard />} />
                <Route path="geography" element={<GeographyDashboard />} />
                <Route path="products" element={<ProductPerformanceDashboard />} />
                <Route path="shipping" element={<ShippingOperationsDashboard />} />
              </Route>

              {/* Procurement master dashboard */}
              <Route
                path="/procurement"
                element={
                  <ProtectedRoute>
                    <ProcurementLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="spend" replace />} />
                <Route path="spend"    element={<SpendOverviewDashboard />} />
                <Route path="supplier" element={<SupplierPerformanceDashboard />} />
                <Route path="orders"   element={<PurchaseOrdersDashboard />} />
                <Route path="inventory" element={<InventoryAnalysisDashboard />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AgGridProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
