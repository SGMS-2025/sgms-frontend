import React from 'react';
import { Outlet } from 'react-router-dom';
import { PTSidebar } from '@/components/layout/PTSidebar';
import { SidebarProvider } from '@/contexts/SidebarContext';

const PTLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="h-screen bg-[#f1f3f4] flex">
        <PTSidebar />
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export { PTLayout };
