import React from 'react';
import { Outlet } from 'react-router-dom';
import { OwnerSidebar } from '@/components/layout/OwnerSidebar';

const ManageLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f1f3f4] flex flex-col">
      <div className="flex flex-1">
        <OwnerSidebar />
        <div className="flex-1 p-6 h-screen overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ManageLayout;
