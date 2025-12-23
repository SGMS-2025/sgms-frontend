import React from 'react';
import { TechnicianSidebar } from '@/components/layout/TechnicianSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { BaseLayout } from './BaseLayout';

const TechnicianLayout: React.FC = () => {
  return <BaseLayout SidebarComponent={TechnicianSidebar} HeaderComponent={DashboardHeader} />;
};

export { TechnicianLayout };
