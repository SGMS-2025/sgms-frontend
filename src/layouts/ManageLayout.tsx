import React from 'react';
import { Outlet } from 'react-router-dom';
import { OwnerSidebar } from '@/components/layout/OwnerSidebar';
import { SidebarProvider } from '@/contexts/SidebarContext';

const ManageLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="h-screen bg-[#f1f3f4] flex">
        <OwnerSidebar />
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ManageLayout;
