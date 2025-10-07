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
import ZaloCallbackPage from '@/pages/auth/ZaloCallbackPage';
import HomePage from '@/pages/home-test';
import LandingPage from '@/pages/landing/LandingPage';
import GymListPage from '@/pages/gyms/GymListPage';
import GymDetailPage from '@/pages/gyms/GymDetailPage';
import { UserProfile } from '@/pages/profile/ProfilePage';
import OwnerDashboard from '@/pages/owner/OwnerDashboard';
import StaffPage from '@/pages/owner/StaffPage';
import BranchDetailPage from '@/pages/owner/BranchDetailPage';
import AddBranchPage from '@/pages/owner/AddBranchPage';
import AddNewStaff from '@/pages/owner/AddNewStaff';
import DiscountPage from '@/pages/owner/DiscountPage';
import TestimonialPage from '@/pages/owner/TestimonialPage';
import { TechnicianLayout } from '@/layouts/TechnicianLayout';
import TechnicianDashboard from '@/pages/technician/TechnicianDashboard';
import { EquipmentListPage } from '@/pages/technician/EquipmentListPage';
import { AddEquipmentPage } from '@/pages/technician/AddEquipmentPage';
import { EditEquipmentPage } from '@/pages/technician/EditEquipmentPage';
import MembershipPlansPage from '@/pages/owner/MembershipPlansPage';
import AddWorkShiftPage from '@/pages/owner/AddWorkShiftPage';
import EditWorkShiftPage from '@/pages/owner/EditWorkShiftPage';
import WorkShiftCalendarPage from '@/pages/owner/WorkShiftCalendarPage';
import TechnicianCalendarPage from '@/pages/technician/TechnicianCalendarPage';
import PTServiceManagement from '@/components/dashboard/PTServiceManagement';
import ClassServiceManagement from '@/components/dashboard/ClassServiceManagement';
import { PTLayout } from '@/layouts/PTLayout';
import PTDashboard from '@/pages/pt/PTDashboard';
import PTCalendarPage from '@/pages/pt/PTCalendarPage';
import { useAuthState } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { OwnerSidebar } from '@/components/layout/OwnerSidebar';
import { TechnicianSidebar } from '@/components/layout/TechnicianSidebar';

// WorkShift Calendar with Layout Component
const WorkShiftCalendarPageWithLayout: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuthState();

  // Show loading while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Check if user has permission to access workshift calendar
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Allow OWNER and STAFF roles
  if (user.role !== 'OWNER' && user.role !== 'STAFF') {
    return <Navigate to="/home" replace />;
  }

  // Choose appropriate sidebar based on user role
  const renderSidebar = () => {
    if (user.role === 'OWNER') {
      return <OwnerSidebar />;
    } else if (user.role === 'STAFF') {
      return <TechnicianSidebar />;
    }
    return <OwnerSidebar />; // fallback
  };

  return (
    <SidebarProvider>
      <div className="h-screen bg-[#f1f3f4] flex">
        {renderSidebar()}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <WorkShiftCalendarPage />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

// Protected Route Component - supports multiple roles and job titles
interface ProtectedRouteProps {
  allowedRoles?: string | string[]; // Can accept a single role or array of roles
  allowedJobTitles?: string | string[]; // Can accept a single job title or array of job titles
  fallbackPath?: string; // Redirect path when no permission (default: go back to previous page)
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, allowedJobTitles, fallbackPath }) => {
  const { isAuthenticated, user, isLoading } = useAuthState();
  const { t } = useTranslation();

  // Only fetch staff info if we need to check job titles
  const needsStaffInfo = allowedJobTitles && allowedJobTitles.length > 0;
  const { currentStaff, loading: staffLoading } = useCurrentUserStaff();

  const rolesArray = allowedRoles ? (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]) : [];
  const jobTitlesArray = allowedJobTitles
    ? Array.isArray(allowedJobTitles)
      ? allowedJobTitles
      : [allowedJobTitles]
    : [];

  // Check permission based on role or job title
  const hasRolePermission = user && rolesArray.length > 0 ? rolesArray.includes(user.role) : false;

  // Only check job title permission if we have staff data or if we don't need staff info
  const hasJobTitlePermission = needsStaffInfo
    ? currentStaff && jobTitlesArray.length > 0
      ? jobTitlesArray.includes(currentStaff.jobTitle)
      : false
    : false;

  const isWaitingForStaffData = user?.role === 'STAFF' && needsStaffInfo && (staffLoading || !currentStaff);

  const hasPermission =
    rolesArray.length === 0 && jobTitlesArray.length === 0
      ? true
      : user?.role === 'STAFF'
        ? hasRolePermission && hasJobTitlePermission
        : hasRolePermission || hasJobTitlePermission;

  useEffect(() => {
    const shouldShowError = isAuthenticated && user && !hasPermission && !isLoading && !isWaitingForStaffData;

    if (shouldShowError) {
      toast.error(t('error.UNAUTHORIZED'));
    }
  }, [isAuthenticated, user, hasPermission, isLoading, isWaitingForStaffData, t]);

  if (isLoading || isWaitingForStaffData) {
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

      <Route path="/auth/zalo/callback" element={<ZaloCallbackPage />} />

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

      {/* Gym Routes - Public routes */}
      <Route path="/gyms" element={<GymListPage />} />
      <Route path="/gym/:id" element={<GymDetailPage />} />

      {/* Work Shift Calendar Route - accessible to all STAFF (must be before /manage route) */}
      <Route path="/manage/workshifts/calendar" element={<WorkShiftCalendarPageWithLayout />} />

      {/* Management Routes - for OWNER role and STAFF with Manager job title */}
      <Route
        path="/manage"
        element={<ProtectedRoute allowedRoles={['OWNER', 'STAFF']} allowedJobTitles={['Manager']} />}
      >
        <Route path="" element={<ManageLayout />}>
          {/* Owner Dashboard Route */}
          <Route path="owner" element={<OwnerDashboard />} />
          {/* Staff Management Route */}
          <Route path="staff" element={<StaffPage />} />
          {/* Branch Detail Route */}
          <Route path="branch/:branchId" element={<BranchDetailPage />} />
          {/* Add Branch Route */}
          <Route path="add-branch" element={<AddBranchPage />} />
          {/* Add New Staff Route */}
          <Route path="staff/add" element={<AddNewStaff />} />
          {/* Personal Training Management Route */}
          <Route path="pt-services" element={<PTServiceManagement />} />
          {/* Class Service Management Route */}
          <Route path="class-services" element={<ClassServiceManagement />} />
          {/* Services Management Route */}
          <Route path="discounts" element={<DiscountPage />} />
          {/* Membership Management Route */}
          <Route path="memberships" element={<MembershipPlansPage />} />
          {/* Testimonial Management Route */}
          <Route path="testimonials" element={<TestimonialPage />} />

          {/* Shared Equipment Routes for Manager */}
          <Route path="equipment" element={<EquipmentListPage />} />
          <Route path="equipment/add" element={<AddEquipmentPage />} />
          <Route path="equipment/:id/edit" element={<EditEquipmentPage />} />

          {/* Work Shift Management Routes */}
          <Route path="workshifts/add" element={<AddWorkShiftPage />} />
          <Route path="workshifts/:id/edit" element={<EditWorkShiftPage />} />
        </Route>
      </Route>

      {/* Equipment Management Routes - for Technician only */}
      <Route
        path="/manage/technician"
        element={
          <ProtectedRoute
            allowedRoles={['STAFF', 'OWNER', 'ADMIN']}
            allowedJobTitles={['Technician']}
            fallbackPath="/home"
          />
        }
      >
        <Route path="" element={<TechnicianLayout />}>
          {/* Dashboard Route */}
          <Route path="" element={<TechnicianDashboard />} />

          {/* Shared Equipment Routes for Technician */}
          <Route path="equipment" element={<EquipmentListPage />} />
          <Route path="equipment/add" element={<AddEquipmentPage />} />
          <Route path="equipment/:id/edit" element={<EditEquipmentPage />} />

          {/* Calendar Route for Technician */}
          <Route path="calendar" element={<TechnicianCalendarPage />} />

          <Route path="*" element={<Navigate to="/manage/technician" replace />} />
        </Route>
      </Route>

      {/* Personal Trainer Routes - for Personal Trainer only */}
      <Route
        path="/manage/pt"
        element={
          <ProtectedRoute
            allowedRoles={['STAFF', 'OWNER', 'ADMIN']}
            allowedJobTitles={['Personal Trainer']}
            fallbackPath="/home"
          />
        }
      >
        <Route path="" element={<PTLayout />}>
          {/* Dashboard Route */}
          <Route path="" element={<PTDashboard />} />

          {/* Calendar Route for PT */}
          <Route path="calendar" element={<PTCalendarPage />} />

          <Route path="*" element={<Navigate to="/manage/pt" replace />} />
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
