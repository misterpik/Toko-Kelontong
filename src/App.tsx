import { Suspense, useState, useEffect } from "react";
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
import ManageCashiersPage from "./components/pages/owner/kelola-kasir";
import CashierDashboard from "./components/pages/kasir/dashboard";
import SuperAdminDashboard from "./components/pages/superadmin/dashboard";
import { AuthProvider, useAuth } from '@/../supabase/auth';
import { supabase } from '@/../supabase/supabase';
import { Toaster } from "./components/ui/toaster";
import { LoadingScreen, LoadingSpinner } from "./components/ui/loading-spinner";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const [tenantStatus, setTenantStatus] = useState<string | null>(null);
  const [checkingTenant, setCheckingTenant] = useState(true);

  useEffect(() => {
    const checkTenantStatus = async () => {
      if (!user) {
        setCheckingTenant(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role, tenant_id')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        // Super admin doesn't have tenant restriction
        if (data?.role === 'super_admin') {
          setTenantStatus('active');
        } else if (data?.tenant_id) {
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('status')
            .eq('id', data.tenant_id)
            .single();

          if (tenantError) throw tenantError;
          setTenantStatus(tenantData?.status || 'active');
        }
      } catch (error) {
        console.error('Error checking tenant status:', error);
      } finally {
        setCheckingTenant(false);
      }
    };

    checkTenantStatus();
  }, [user]);

  if (loading || checkingTenant) {
    return <LoadingScreen text="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (tenantStatus === 'inactive') {
    signOut();
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function RoleBasedRedirect() {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setUserRole(data?.role || null);
      } catch (error) {
        console.error('Error checking user role:', error);
      } finally {
        setCheckingRole(false);
      }
    };

    checkUserRole();
  }, [user]);

  if (loading || checkingRole) {
    return <LoadingScreen text="Checking permissions..." />;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (userRole === 'super_admin') {
    return <Navigate to="/superadmin/dashboard" />;
  } else if (userRole === 'owner') {
    return <Navigate to="/owner/dashboard" />;
  } else if (userRole === 'kasir') {
    return <Navigate to="/kasir/dashboard" />;
  }

  return <Navigate to="/owner/dashboard" />;
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
              <RoleBasedRedirect />
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
          path="/owner/kelola-kasir"
          element={
            <PrivateRoute>
              <ManageCashiersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/kasir/dashboard"
          element={
            <PrivateRoute>
              <CashierDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/superadmin/dashboard"
          element={
            <PrivateRoute>
              <SuperAdminDashboard />
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