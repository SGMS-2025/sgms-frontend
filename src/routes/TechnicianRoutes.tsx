import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TechnicianDashboard from '../pages/technician/TechnicianDashboard';
import { EquipmentListPage } from '../pages/technician/EquipmentListPage';
import { AddEquipmentPage } from '../pages/technician/AddEquipmentPage';
import { EquipmentDetailPage } from '../pages/technician/EquipmentDetailPage';
import { EditEquipmentPage } from '../pages/technician/EditEquipmentPage';

export const TechnicianRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Dashboard Route */}
      <Route path="/" element={<TechnicianDashboard />} />

      {/* Equipment Routes */}
      <Route path="/equipment" element={<EquipmentListPage />} />
      <Route path="/equipment/add" element={<AddEquipmentPage />} />
      <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
      <Route path="/equipment/:id/edit" element={<EditEquipmentPage />} />

      {/* TODO: Add other technician routes */}
      {/* <Route path="/maintenance" element={<MaintenancePage />} /> */}
      {/* <Route path="/reports" element={<ReportsPage />} /> */}
      {/* <Route path="/schedule" element={<SchedulePage />} /> */}

      {/* Catch all route - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/manage/technician" replace />} />
    </Routes>
  );
};
