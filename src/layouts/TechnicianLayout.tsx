import React from 'react';
import { Outlet } from 'react-router-dom';
import { TechnicianSidebar } from '@/components/layout/TechnicianSidebar';
import { SidebarProvider } from '@/contexts/SidebarContext';

const TechnicianLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="h-screen bg-[#f1f3f4] flex">
        <TechnicianSidebar />
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export { TechnicianLayout };
