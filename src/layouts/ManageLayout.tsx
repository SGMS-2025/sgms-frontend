import React from 'react';
import { Outlet } from 'react-router-dom';
import { OwnerSidebar } from '@/components/layout/OwnerSidebar';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

const ManageLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="h-screen bg-[#f1f3f4] flex overflow-hidden">
        <OwnerSidebar />
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {/* Header - Sticky */}
          <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="px-5 py-2 pb-3">
              <DashboardHeader />
            </div>
          </div>
          {/* Main Content */}
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ManageLayout;
