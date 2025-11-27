import React from 'react';
import { Outlet } from 'react-router-dom';
import { TechnicianSidebar } from '@/components/layout/TechnicianSidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import logoImage from '@/assets/images/logo2.png';

const TechnicianLayoutContent: React.FC = () => {
  const { isMobileOpen, setMobileOpen } = useSidebar();

  return (
    <div className="h-screen bg-[#f1f3f4] flex relative overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
        ${isMobileOpen ? 'fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto' : 'hidden lg:block'}
        transition-transform duration-300 ease-in-out
      `}
      >
        <TechnicianSidebar />
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
        {/* Mobile Header - Sticky */}
        <div className="lg:hidden sticky top-0 z-[100] bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <Button variant="ghost" size="sm" onClick={() => setMobileOpen(true)} className="p-2">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="GYM SMART Logo" className="w-6 h-6 object-contain" />
            <span className="font-bold text-gray-900">GYM SMART</span>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Header - Sticky (Desktop only) */}
        <div className="hidden lg:block sticky top-0 z-[99] bg-white border-b border-gray-200 shadow-sm">
          <div className="px-3 py-2 pb-3">
            <DashboardHeader />
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

const TechnicianLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <TechnicianLayoutContent />
    </SidebarProvider>
  );
};

export { TechnicianLayout };
