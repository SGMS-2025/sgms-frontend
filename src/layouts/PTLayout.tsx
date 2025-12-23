import React from 'react';
import { PTSidebar } from '@/components/layout/PTSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { BaseLayout } from './BaseLayout';

const PTLayout: React.FC = () => {
  return <BaseLayout SidebarComponent={PTSidebar} HeaderComponent={DashboardHeader} />;
};

export { PTLayout };
