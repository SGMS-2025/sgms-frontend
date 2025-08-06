import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ExamplePage from '@/pages/example/ExamplePage';
import ExampleLayout from '@/layouts/example/ExampleLayout';

// You can add a protected route component here if needed
// const ProtectedRoute: React.FC<{ allowedRole: string }> = ({ allowedRole }) => {
//   // Add your authentication logic here
//   return <Outlet />;
// };

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root Route */}
      <Route path="/" element={<Navigate to="/example" replace />} />

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
