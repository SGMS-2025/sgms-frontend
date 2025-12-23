import React from 'react';
import { Outlet } from 'react-router-dom';
import { CustomerSidebar } from '@/components/layout/CustomerSidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerHeader } from '@/components/dashboard/CustomerHeader';
import logoImage from '@/assets/images/logo2.png';

const CustomerLayoutContent: React.FC = () => {
  const { isMobileOpen, setMobileOpen, isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-[#f1f3f4] relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <CustomerSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <>
          {/* Dark overlay backdrop with fade-in animation */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-in fade-in-0 duration-300"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar with slide-in animation */}
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden animate-in slide-in-from-left-full duration-300">
            <CustomerSidebar />
          </div>
        </>
      )}

      {/* Main Content - Adjusted for fixed sidebar */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Mobile Header - Fixed */}
        <div
          className={`lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between z-[100] shadow-sm`}
        >
          <Button variant="ghost" size="sm" onClick={() => setMobileOpen(true)} className="p-1">
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1">
            <img src={logoImage} alt="GYM SMART Logo" className="w-5 h-5 object-contain" />
            <span className="font-bold text-gray-900 text-sm">GYM SMART</span>
          </div>
          <div className="w-6" /> {/* Spacer for centering */}
        </div>
        {/* Header - Fixed (Desktop only) */}
        <div
          className={`hidden lg:block fixed top-0 bg-white border-b border-gray-200 shadow-sm z-[99] ${isCollapsed ? 'left-16' : 'left-64'} right-0`}
        >
          <div className="px-3 py-5 pb-4">
            <CustomerHeader />
          </div>
        </div>
        {/* Spacer for fixed header */}
        <div className="lg:hidden h-[49px]"></div> {/* Mobile header height */}
        <div className="hidden lg:block h-[73px]"></div> {/* Desktop header height */}
        {/* Main Content - Simple div with padding */}
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const CustomerLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <CustomerLayoutContent />
    </SidebarProvider>
  );
};

export { CustomerLayout };
