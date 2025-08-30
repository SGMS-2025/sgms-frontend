import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ExamplePage from '@/pages/example/ExamplePage';
import ExampleLayout from '@/layouts/example/ExampleLayout';
import LoginPage from '@/pages/auth/LoginPage';
import HomePage from '@/pages/home-test';
import { useIsAuthenticated } from '@/hooks/useAuth';

// You can add a protected route component here if needed
// const ProtectedRoute: React.FC<{ allowedRole: string }> = ({ allowedRole }) => {
//   // Add your authentication logic here
//   return <Outlet />;
// };

const AppRoutes: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();

  return (
    <Routes>
      {/* Root Route - redirect based on auth status */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/home' : '/login'} replace />} />

      {/* Auth Routes - redirect to home if already authenticated */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/home" replace /> : <LoginPage />} />

      {/* Home Route - redirect to login if not authenticated */}
      <Route path="/home" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />} />

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
