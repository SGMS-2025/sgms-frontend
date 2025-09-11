import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import ExamplePage from '@/pages/example/ExamplePage';
import ExampleLayout from '@/layouts/example/ExampleLayout';
import ManageLayout from '@/layouts/ManageLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import VerifyOTPPage from '@/pages/auth/VerifyOTPPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import VerifyForgotPasswordOTPPage from '@/pages/auth/VerifyForgotPasswordOTPPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import HomePage from '@/pages/home-test';
import LandingPage from '@/pages/landing/LandingPage';
import { UserProfile } from '@/pages/profile/ProfilePage';
import OwnerDashboard from '@/pages/owner/OwnerDashboard';
import StaffPage from '@/pages/owner/StaffPage';
import { useAuthState } from '@/hooks/useAuth';

// Protected Route Component - supports multiple roles
interface ProtectedRouteProps {
  allowedRoles: string | string[]; // Can accept a single role or array of roles
  fallbackPath?: string; // Redirect path when no permission (default: go back to previous page)
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, fallbackPath }) => {
  const { isAuthenticated, user, isLoading } = useAuthState();
  const { t } = useTranslation();

  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  const hasPermission = user ? rolesArray.includes(user.role) : false;

  useEffect(() => {
    if (isAuthenticated && user && !hasPermission) {
      toast.error(t('error.UNAUTHORIZED'));
    }
  }, [isAuthenticated, user, hasPermission, t]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/home" replace />;
  }

  // If no permission, redirect to safe fallback
  if (!hasPermission) {
    if (fallbackPath) {
      return <Navigate to={fallbackPath} replace />;
    } else {
      return <Navigate to="/home" replace />; // Sửa lại Navigate to sau
    }
  }

  // If has permission, render children routes
  return <Outlet />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuthState();

  return (
    <Routes>
      {/* Root Route - redirect based on auth status */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Routes - redirect to home if already authenticated */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/home" replace /> : <LoginPage />} />

      {/* Auth Routes - redirect to home if already authenticated */}
      <Route path="/register" element={isAuthenticated ? <Navigate to="/home" replace /> : <RegisterPage />} />

      {/* Verify OTP Route - redirect to home if already authenticated */}
      <Route path="/verify-otp" element={isAuthenticated ? <Navigate to="/home" replace /> : <VerifyOTPPage />} />

      {/* Forgot Password Routes */}
      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <ForgotPasswordPage />}
      />
      <Route
        path="/verify-forgot-password-otp"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <VerifyForgotPasswordOTPPage />}
      />
      <Route
        path="/reset-password"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <ResetPasswordPage />}
      />

      {/* Home Route - redirect to login if not authenticated */}
      <Route path="/home" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />} />

      {/* Profile Route */}
      <Route path="/profile" element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" replace />} />

      {/* Management Routes - only for OWNER and MANAGER */}
      <Route path="/manage" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER']} />}>
        <Route path="" element={<ManageLayout />}>
          {/* Owner Dashboard Route */}
          <Route path="owner" element={<OwnerDashboard />} />
          {/* Staff Management Route */}
          <Route path="staff" element={<StaffPage />} />
        </Route>
      </Route>

      {/* Example Routes */}
      <Route path="/example/*" element={<ExampleLayout />}>
        <Route path="" element={<ExamplePage />} />
        {/* Add more example routes here */}
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
