import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { Menu, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

const AdminLayoutContent: React.FC = () => {
  const { isMobileOpen, setMobileOpen } = useSidebar();

  return (
    <div className="h-screen bg-[#f1f3f4] flex relative overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
        ${isMobileOpen ? 'fixed inset-y-0 left-0 z-[100] lg:relative lg:z-auto' : 'hidden lg:block'}
        transition-transform duration-300 ease-in-out
      `}
      >
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div
        className="flex-1 overflow-y-auto hide-scrollbar relative min-w-0"
        onClick={() => {
          if (isMobileOpen) {
            setMobileOpen(false);
          }
        }}
      >
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between relative">
          <Button variant="ghost" size="sm" onClick={() => setMobileOpen(true)} className="p-2">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-600 to-orange-400 rounded flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Admin Panel</span>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-3 py-2 pb-3">
            <DashboardHeader hideBranchSelector />
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 min-w-0 w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AdminLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <AdminLayoutContent />
    </SidebarProvider>
  );
};

export { AdminLayout };
