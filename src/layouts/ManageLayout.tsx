import React from 'react';
import { Outlet } from 'react-router-dom';
import { OwnerSidebar } from '@/components/layout/OwnerSidebar';
import { SidebarProvider } from '@/contexts/SidebarContext';

const ManageLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#f1f3f4] flex flex-col">
        <div className="flex flex-1">
          <OwnerSidebar />
          <div className="flex-1 p-6 h-screen overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ManageLayout;
