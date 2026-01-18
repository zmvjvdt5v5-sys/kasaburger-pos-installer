import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import { Layout } from './components/Layout';

// Suppress postMessage errors globally
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.message && (e.message.includes('postMessage') || e.message.includes('cloned') || e.message.includes('Request object'))) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
}

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Materials from './pages/Materials';
import Recipes from './pages/Recipes';
import Production from './pages/Production';
import Dealers from './pages/Dealers';
import Orders from './pages/Orders';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Accounting from './pages/Accounting';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Campaigns from './pages/Campaigns';
import DealerLogin from './pages/DealerLogin';
import DealerPortal from './pages/DealerPortal';
import KioskPage from './pages/KioskPage';
import KioskAdmin from './pages/KioskAdmin';
import KioskOrders from './pages/KioskOrders';
import BranchManagement from './pages/BranchManagement';
import BranchReports from './pages/BranchReports';
import DeliveryOrders from './pages/DeliveryOrders';
import DeliveryPanel from './pages/DeliveryPanel';

// POS / Adisyon Pages
import POSMain from './pages/pos/POSMain';
import KitchenDisplay from './pages/pos/KitchenDisplay';
import POSReports from './pages/pos/POSReports';
import InPOSSettings from './pages/pos/InPOSSettings';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Dealer Protected Route Component
const DealerProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'dealer') {
    return <Navigate to="/dealer-login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Route Component (redirects to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      
      {/* Dealer Portal Routes */}
      <Route path="/dealer-login" element={<DealerLogin />} />
      <Route path="/dealer" element={<DealerPortal />} />
      
      {/* Dealer Protected Routes - Bayi Paneli */}
      <Route
        path="/dealer-portal"
        element={
          <DealerProtectedRoute>
            <DealerPortal />
          </DealerProtectedRoute>
        }
      />
      <Route
        path="/dealer-portal/orders"
        element={
          <DealerProtectedRoute>
            <DealerPortal initialTab="orders" />
          </DealerProtectedRoute>
        }
      />
      <Route
        path="/dealer-portal/products"
        element={
          <DealerProtectedRoute>
            <DealerPortal initialTab="products" />
          </DealerProtectedRoute>
        }
      />
      <Route
        path="/dealer-portal/invoices"
        element={
          <DealerProtectedRoute>
            <DealerPortal initialTab="invoices" />
          </DealerProtectedRoute>
        }
      />
      <Route
        path="/dealer-portal/payments"
        element={
          <DealerProtectedRoute>
            <DealerPortal initialTab="payments" />
          </DealerProtectedRoute>
        }
      />
      <Route
        path="/dealer-portal/campaigns"
        element={
          <DealerProtectedRoute>
            <DealerPortal initialTab="campaigns" />
          </DealerProtectedRoute>
        }
      />
      <Route
        path="/dealer-portal/reports"
        element={
          <DealerProtectedRoute>
            <DealerPortal initialTab="reports" />
          </DealerProtectedRoute>
        }
      />
      <Route
        path="/dealer-portal/settings"
        element={
          <DealerProtectedRoute>
            <DealerPortal initialTab="settings" />
          </DealerProtectedRoute>
        }
      />
      <Route
        path="/dealer-portal/delivery"
        element={
          <DealerProtectedRoute>
            <DeliveryOrders isDealer={true} />
          </DealerProtectedRoute>
        }
      />
      <Route
        path="/dealer-portal/kiosk-orders"
        element={
          <DealerProtectedRoute>
            <KioskOrders isDealer={true} />
          </DealerProtectedRoute>
        }
      />
      <Route
        path="/dealer-portal/delivery-panel"
        element={
          <DealerProtectedRoute>
            <DeliveryPanel isDealer={true} />
          </DealerProtectedRoute>
        }
      />
      
      {/* POS / Adisyon Routes */}
      <Route
        path="/dealer-portal/pos"
        element={
          <DealerProtectedRoute>
            <POSMain isDealer={true} />
          </DealerProtectedRoute>
        }
      />
      <Route
        path="/dealer-portal/kitchen"
        element={
          <DealerProtectedRoute>
            <KitchenDisplay />
          </DealerProtectedRoute>
        }
      />
      <Route
        path="/dealer-portal/pos-reports"
        element={
          <DealerProtectedRoute>
            <POSReports />
          </DealerProtectedRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/materials"
        element={
          <ProtectedRoute>
            <Materials />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipes"
        element={
          <ProtectedRoute>
            <Recipes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/production"
        element={
          <ProtectedRoute>
            <Production />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dealers"
        element={
          <ProtectedRoute>
            <Dealers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <Invoices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounting"
        element={
          <ProtectedRoute>
            <Accounting />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <ProtectedRoute>
            <Campaigns />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kiosk-admin"
        element={
          <ProtectedRoute>
            <KioskAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kiosk-orders"
        element={
          <ProtectedRoute>
            <KioskOrders />
          </ProtectedRoute>
        }
      />

      {/* Şube Yönetimi */}
      <Route
        path="/branches"
        element={
          <ProtectedRoute>
            <BranchManagement />
          </ProtectedRoute>
        }
      />

      {/* Şube Raporları */}
      <Route
        path="/branch-reports"
        element={
          <ProtectedRoute>
            <BranchReports />
          </ProtectedRoute>
        }
      />

      {/* Paket Servis Siparişleri */}
      <Route
        path="/delivery-orders"
        element={
          <ProtectedRoute>
            <DeliveryOrders />
          </ProtectedRoute>
        }
      />

      {/* Canlı Sipariş Paneli */}
      <Route
        path="/delivery-panel"
        element={
          <ProtectedRoute>
            <DeliveryPanel />
          </ProtectedRoute>
        }
      />

      {/* Default Redirect - Check domain for kiosk */}
      <Route path="/" element={<HomeRedirect />} />
      
      {/* Self-Service Kiosk - No Auth Required */}
      <Route path="/kiosk" element={<KioskPage />} />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Home redirect component - redirects based on domain
const HomeRedirect = () => {
  const hostname = window.location.hostname;
  
  // If accessing from kasaburger.net, go to kiosk
  if (hostname === 'kasaburger.net' || hostname === 'www.kasaburger.net' || hostname.includes('kiosk')) {
    return <Navigate to="/kiosk" replace />;
  }
  
  // Otherwise go to dashboard (admin panel)
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
