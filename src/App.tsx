import { Suspense } from "react";
import { Navigate, Route, Routes, useRoutes } from "react-router-dom";
import routes from "tempo-routes";
import LoginForm from "./components/auth/LoginForm";
import SignUpForm from "./components/auth/SignUpForm";
import Dashboard from "./components/pages/dashboard";
import Success from "./components/pages/success";
import Home from "./components/pages/home";
import OwnerDashboard from "./components/pages/owner/dashboard";
import StockManagement from "./components/pages/owner/stok";
import SupplierManagement from "./components/pages/owner/supplier";
import PurchaseManagement from "./components/pages/owner/pembelian";
import ReportsPage from "./components/pages/owner/laporan";
import SettingsPage from "./components/pages/owner/pengaturan";
import POSPage from "./components/pages/owner/pos";
import { AuthProvider, useAuth } from '@/../supabase/auth';
import { Toaster } from "./components/ui/toaster";
import { LoadingScreen, LoadingSpinner } from "./components/ui/loading-spinner";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen text="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner/dashboard"
          element={
            <PrivateRoute>
              <OwnerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner/pos"
          element={
            <PrivateRoute>
              <POSPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner/stok"
          element={
            <PrivateRoute>
              <StockManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner/supplier"
          element={
            <PrivateRoute>
              <SupplierManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner/pembelian"
          element={
            <PrivateRoute>
              <PurchaseManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner/laporan"
          element={
            <PrivateRoute>
              <ReportsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner/pengaturan"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/success"
          element={
            <Success />
          }
        />
      </Routes>
      {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingScreen text="Loading application..." />}>
        <AppRoutes />
      </Suspense>
      <Toaster />
    </AuthProvider>
  );
}

export default App;