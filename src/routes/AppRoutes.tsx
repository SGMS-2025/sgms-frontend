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
import OwnerLandingPage from '@/pages/landing/OwnerLandingPage';
import GymListPage from '@/pages/gyms/GymListPage';
import GymDetailPage from '@/pages/gyms/GymDetailPage';
import { UserProfile } from '@/pages/profile/ProfilePage';
import OwnerDashboard from '@/pages/owner/OwnerDashboard';
import StaffPage from '@/pages/owner/StaffPage';
import BranchDetailPage from '@/pages/owner/BranchDetailPage';
import AddBranchPage from '@/pages/owner/AddBranchPage';
import { SubscriptionPackagesPage } from '@/pages/owner/SubscriptionPackagesPage';
import AddNewStaff from '@/pages/owner/AddNewStaff';
import DiscountPage from '@/pages/owner/DiscountPage';
import TestimonialPage from '@/pages/owner/TestimonialPage';
import { TechnicianLayout } from '@/layouts/TechnicianLayout';
import TechnicianDashboard from '@/pages/technician/TechnicianDashboard';
import { EquipmentListPage } from '@/pages/technician/EquipmentListPage';
import { AddEquipmentPage } from '@/pages/technician/AddEquipmentPage';
import { EditEquipmentPage } from '@/pages/technician/EditEquipmentPage';
import { EquipmentIssueReportPage } from '@/pages/technician/EquipmentIssueReportPage';
import { EquipmentIssueHistoryPage } from '@/pages/technician/EquipmentIssueHistoryPage';
import { EquipmentInventoryPage } from '@/pages/technician/EquipmentInventoryPage';
import TechnicianAttendanceHistoryPage from '@/pages/technician/TechnicianAttendanceHistoryPage';
import { EquipmentInventorySessionPage } from '@/pages/technician/EquipmentInventorySessionPage';
import MembershipPlansPage from '@/pages/owner/MembershipPlansPage';
import ExpensesPage from '@/pages/owner/ExpensesPage';
import AddWorkShiftPage from '@/pages/owner/AddWorkShiftPage';
import EditWorkShiftPage from '@/pages/owner/EditWorkShiftPage';
import WorkShiftCalendarPage from '@/pages/owner/WorkShiftCalendarPage';
import TechnicianCalendarPage from '@/pages/technician/TechnicianCalendarPage';
import PTServiceManagement from '@/components/dashboard/PTServiceManagement';
import ClassServiceManagement from '@/components/dashboard/ClassServiceManagement';
import { PTLayout } from '@/layouts/PTLayout';
import PTDashboard from '@/pages/pt/PTDashboard';
import PTCalendarPage from '@/pages/pt/PTCalendarPage';
import PTCustomerListPage from '@/pages/pt/PTCustomerListPage';
import PTAttendanceHistoryPage from '@/pages/pt/PTAttendanceHistoryPage';
import TrainingProgressDetailPage from '@/pages/pt/TrainingProgressDetailPage';
import CustomerManagementPage from '@/pages/owner/CustomerManagementPage';
import CustomerDetailPage from '@/pages/owner/CustomerDetailPage';
import TimeOffPage from '@/pages/owner/TimeOffPage';
import TimeOffManagementPage from '@/pages/owner/TimeOffManagementPage';
import PTTimeOffPage from '@/pages/pt/TimeOffPage';
import TechnicianTimeOffPage from '@/pages/technician/TimeOffPage';
import CustomerPaymentsPage from '@/pages/owner/CustomerPaymentsPage';
import ContractsPage from '@/pages/owner/ContractsPage';
import { useAuthState } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import AttendancePage from '@/pages/attendance/AttendancePage';
import RescheduleManagementPage from '@/pages/owner/RescheduleManagementPage';
import CustomerSecurity from '@/pages/customer/CustomerSecurity';
import CustomerProgress from '@/pages/customer/CustomerProgress';
import CustomerSchedule from '@/pages/customer/CustomerSchedule';
import CustomerMembership from '@/pages/customer/CustomerMembership';
import CustomerProfile from '@/pages/customer/CustomerProfile';
import CustomerDashboard from '@/pages/customer/CustomerDashboard';
import { CustomerLayout } from '@/layouts/CustomerLayout';
import BusinessVerificationPage from '@/pages/auth/BusinessVerificationPage';
import BusinessVerificationManagementPage from '@/pages/admin/BusinessVerificationManagementPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminSubscriptionsPage from '@/pages/admin/AdminSubscriptionsPage';
import AdminSubscriptionPackagesPage from '@/pages/admin/AdminSubscriptionPackagesPage';
import { AdminLayout } from '@/layouts/AdminLayout';
import OwnerSubscriptionGate from '@/components/guards/OwnerSubscriptionGate';
import OwnerSubscriptionGateWithLayout from '@/components/guards/OwnerSubscriptionGateWithLayout';
import KPIManagementPage from '@/pages/owner/KPIManagementPage';
import MyKPIPage from '@/pages/pt/MyKPIPage';

// WorkShift Calendar with Layout Component
// Note: Layout is provided by OwnerSubscriptionGateWithLayout wrapper
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

  // Just return the page content - layout is handled by OwnerSubscriptionGateWithLayout
  return <WorkShiftCalendarPage />;
};

// Reschedule Management with Layout Component
// Note: Layout is provided by OwnerSubscriptionGateWithLayout wrapper
const RescheduleManagementPageWithLayout: React.FC = () => {
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

  // Check if user has permission to access reschedule
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Allow OWNER and STAFF roles
  if (user.role !== 'OWNER' && user.role !== 'STAFF') {
    return <Navigate to="/home" replace />;
  }

  // Just return the page content - layout is handled by OwnerSubscriptionGateWithLayout
  return <RescheduleManagementPage />;
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

  // Owner subscription gate will render a requirement page instead of redirect

  return (
    <Routes>
      {/* Root Route - redirect based on auth status */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/owners" element={<OwnerLandingPage />} />

      {/* Attendance Route */}
      <Route path="/attendance" element={<AttendancePage />} />

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

      {/* Business Verification Route - for owners to verify their business */}
      <Route path="/business-verification" element={<BusinessVerificationPage />} />

      {/* Reschedule - render requirement inside owner layout when OWNER has no subscription */}
      <Route element={<OwnerSubscriptionGateWithLayout />}>
        <Route
          path="/reschedule"
          element={isAuthenticated ? <RescheduleManagementPageWithLayout /> : <Navigate to="/login" replace />}
        />
      </Route>

      {/* Gym Routes - Public routes */}
      <Route path="/gyms" element={<GymListPage />} />
      <Route path="/gym/:id" element={<GymDetailPage />} />

      {/* Work Shift Calendar Route - render requirement inside owner layout when blocked */}
      <Route element={<OwnerSubscriptionGateWithLayout />}>
        <Route path="/manage/workshifts/calendar" element={<WorkShiftCalendarPageWithLayout />} />
      </Route>

      {/* Management Routes - for OWNER role and STAFF with Manager job title */}
      <Route
        path="/manage"
        element={<ProtectedRoute allowedRoles={['OWNER', 'STAFF']} allowedJobTitles={['Manager']} />}
      >
        <Route path="" element={<ManageLayout />}>
          {/* Routes that require active subscription for OWNER */}
          <Route element={<OwnerSubscriptionGate />}>
            {/* Owner Dashboard Route */}
            <Route path="owner" element={<OwnerDashboard />} />
            {/* Staff Management Route */}
            <Route path="staff" element={<StaffPage />} />
            {/* Customer Management Route */}
            <Route path="customers" element={<CustomerManagementPage />} />
            {/* Customer Detail Route */}
            <Route path="customers/:id/detail" element={<CustomerDetailPage />} />
            {/* Customer Payments Route */}
            <Route path="payments" element={<CustomerPaymentsPage />} />
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
            {/* Expenses Management Route */}
            <Route path="expenses" element={<ExpensesPage />} />
            {/* Testimonial Management Route */}
            <Route path="testimonials" element={<TestimonialPage />} />
            {/* Contracts Management Route */}
            <Route path="contracts" element={<ContractsPage />} />
            {/* Shared Equipment Routes for Manager */}
            <Route path="equipment" element={<EquipmentListPage />} />
            <Route path="equipment/add" element={<AddEquipmentPage />} />
            <Route path="equipment/:id/edit" element={<EditEquipmentPage />} />

            {/* Work Shift Management Routes */}
            <Route path="workshifts/add" element={<AddWorkShiftPage />} />
            <Route path="workshifts/:id/edit" element={<EditWorkShiftPage />} />

            {/* Time Off Management Routes */}
            <Route path="timeoff" element={<TimeOffPage />} />
            <Route path="timeoff/management" element={<TimeOffManagementPage />} />

            {/* KPI Management Routes */}
            <Route path="kpi" element={<KPIManagementPage />} />
          </Route>
          {/* Subscription Management Route (accessible without active subscription for OWNER) */}
          <Route path="subscriptions" element={<SubscriptionPackagesPage />} />
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

          {/* Equipment Inventory Routes for Technician */}
          <Route path="equipment-inventory" element={<EquipmentInventoryPage />} />
          <Route path="equipment-inventory/session/:sessionId" element={<EquipmentInventorySessionPage />} />

          {/* Calendar Route for Technician */}
          <Route path="calendar" element={<TechnicianCalendarPage />} />

          {/* Attendance History for Technician */}
          <Route path="attendance" element={<TechnicianAttendanceHistoryPage />} />
          {/* Time Off Route for Technician */}
          <Route path="timeoff" element={<TechnicianTimeOffPage />} />

          {/* Equipment Issue History Route for Technician */}
          <Route path="equipment-issues" element={<EquipmentIssueHistoryPage />} />

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

          {/* Clients Route for PT */}
          <Route path="clients" element={<PTCustomerListPage />} />

          {/* Training Progress Detail Route for PT */}
          <Route path="clients/:id/progress" element={<TrainingProgressDetailPage />} />

          {/* Customers Route for PT - to register packages for customers in branch */}
          <Route path="customers" element={<CustomerManagementPage />} />

          {/* Customer Detail Route for PT */}
          <Route path="customers/:id/detail" element={<CustomerDetailPage />} />

          {/* Time Off Route for PT */}
          <Route path="timeoff" element={<PTTimeOffPage />} />

          {/* Attendance History for PT */}
          <Route path="attendance" element={<PTAttendanceHistoryPage />} />

          {/* Equipment Issue Report Route for PT */}
          <Route path="equipment-issues" element={<EquipmentIssueReportPage />} />

          {/* My KPI Route for PT */}
          <Route path="kpi" element={<MyKPIPage />} />

          <Route path="*" element={<Navigate to="/manage/pt" replace />} />
        </Route>
      </Route>

      {/* Customer Routes - for CUSTOMER role only */}
      <Route path="/customer" element={<ProtectedRoute allowedRoles={['CUSTOMER']} fallbackPath="/home" />}>
        <Route path="" element={<CustomerLayout />}>
          {/* Dashboard Route */}
          <Route path="" element={<CustomerDashboard />} />

          {/* Profile Route */}
          <Route path="profile" element={<CustomerProfile />} />

          {/* Membership Route */}
          <Route path="membership" element={<CustomerMembership />} />

          {/* Schedule Route */}
          <Route path="schedule" element={<CustomerSchedule />} />

          {/* Progress Route */}
          <Route path="progress" element={<CustomerProgress />} />

          {/* Security Route */}
          <Route path="security" element={<CustomerSecurity />} />

          <Route path="*" element={<Navigate to="/customer" replace />} />
        </Route>
      </Route>

      {/* Admin Routes - for ADMIN role only */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']} fallbackPath="/home" />}>
        <Route path="" element={<AdminLayout />}>
          {/* Admin Dashboard */}
          <Route path="" element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />

          {/* Business Verification Management */}
          <Route path="business-verifications" element={<BusinessVerificationManagementPage />} />

          {/* Subscriptions (Admin) */}
          <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
          <Route path="subscriptions/packages" element={<AdminSubscriptionPackagesPage />} />

          {/* TODO: Add more admin routes here */}
          {/* <Route path="users" element={<UserManagementPage />} /> */}
          {/* <Route path="roles" element={<RoleManagementPage />} /> */}
          {/* <Route path="reports" element={<ReportsPage />} /> */}
          {/* <Route path="logs" element={<SystemLogsPage />} /> */}
          {/* <Route path="settings" element={<SystemSettingsPage />} /> */}
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
